import { AvatarStatus, BattleStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const BATTLE_COOLDOWN_MS = 15_000;
const BATTLE_LOCK_PADDING_MS = 2_000;

function shuffle<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

const DEFAULT_AVATAR_STATS = {
  currentHp: 100,
  maxHp: 100,
  damage: 1,
  evasion: 0,
  hpUpgrades: 0,
  damageUpgrades: 0,
  evasionUpgrades: 0,
  points: 0,
  status: AvatarStatus.SEARCHING,
};

const SHOP_ITEMS = [
  {
    id: "item-restoration-kit",
    name: "Kit de restauración",
    description: "Recupera un tramo de vida en la siguiente pelea.",
    price: 10,
    image: "/icons/kit.png",
  },
  {
    id: "item-iron-plate",
    name: "Placa de hierro",
    description: "Aumenta tu defensa pasiva mientras no estás en batalla.",
    price: 18,
    image: "/icons/plate.png",
  },
  {
    id: "item-mystic-flare",
    name: "Destello místico",
    description: "Daño adicional en el primer golpe del turno.",
    price: 25,
    image: "/icons/flare.png",
  },
];

interface AvatarWithUser {
  id: string;
  currentHp: number;
  maxHp: number;
  damage: number;
  evasion: number;
  points: number;
  status: AvatarStatus;
  user: { id: string; username: string; image?: string | null };
}

export async function ensureAvatarForUser(userId: string) {
  return prisma.avatar.upsert({
    where: { userId },
    create: {
      userId,
      ...DEFAULT_AVATAR_STATS,
    },
    update: {},
  });
}

// Hook for creating avatar on registration: call this after user creation
export async function createAvatarOnRegistration(userId: string) {
  return ensureAvatarForUser(userId);
}

export async function getAvatarForUser(userId: string) {
  return prisma.avatar.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, username: true, image: true, fabPixelSprite: true } },
      activeBattle: {
        include: {
          challenger: { include: { user: { select: { id: true, username: true, image: true, fabPixelSprite: true } } } },
          opponent: { include: { user: { select: { id: true, username: true, image: true, fabPixelSprite: true } } } },
        },
      },
    },
  });
}

export async function getAvatarById(id: string) {
  return prisma.avatar.findUnique({
    where: { id },
    include: { user: { select: { id: true, username: true, image: true, fabPixelSprite: true } } },
  });
}

export async function getAvatarHistory(userId: string, limit = 10) {
  const avatar = await ensureAvatarForUser(userId);
  const battles = await prisma.avatarBattle.findMany({
    where: {
      status: BattleStatus.COMPLETE,
      OR: [{ challengerId: avatar.id }, { opponentId: avatar.id }],
    },
    orderBy: { completedAt: "desc" },
    take: limit,
    include: {
      challenger: { include: { user: { select: { id: true, username: true, image: true, fabPixelSprite: true } } } },
      opponent: { include: { user: { select: { id: true, username: true, image: true, fabPixelSprite: true } } } },
    },
  });

  return battles.map((battle) => {
    const isWinner = battle.winnerId === avatar.id;
    const isLoser = battle.loserId === avatar.id;
    let result = "empate";
    if (isWinner) result = "victoria";
    if (isLoser) result = "derrota";

    const opponentAvatar = battle.challengerId === avatar.id ? battle.opponent : battle.challenger;
    return {
      id: battle.id,
      log: battle.log,
      rounds: battle.rounds,
      durationSeconds: battle.durationSeconds,
      result,
      completedAt: battle.completedAt?.toISOString() ?? battle.createdAt.toISOString(),
      opponent: {
        id: opponentAvatar.id,
        maxHp: opponentAvatar.maxHp,
        damage: opponentAvatar.damage,
        evasion: opponentAvatar.evasion,
        points: opponentAvatar.points,
        hudBackgroundImage: opponentAvatar.hudBackgroundImage,
        user: opponentAvatar.user,
      },
      youFirst: battle.firstStrikerId === avatar.id,
    };
  });
}

export async function getAvatarItems(userId: string) {
  const avatar = await ensureAvatarForUser(userId);
  const items = await prisma.avatarItem.findMany({
    where: { avatarId: avatar.id },
    orderBy: { createdAt: "desc" },
  });
  return items;
}

async function releaseExpiredBattleLocks(now: Date) {
  const expired = await prisma.avatar.findMany({
    where: {
      activeBattleId: { not: null },
      battleLockExpiresAt: { lte: now },
    },
    select: { id: true },
  });
  if (expired.length === 0) {
    return;
  }
  await prisma.avatar.updateMany({
    where: { id: { in: expired.map((avatar) => avatar.id) } },
    data: {
      inBattle: false,
      status: AvatarStatus.COOLDOWN,
      activeBattleId: null,
      battleLockExpiresAt: null,
    },
  });
}

async function getLastOpponentMap(avatarIds: string[]): Promise<Map<string, string | null>> {
  const opponentMap = new Map<string, string | null>();
  await Promise.all(
    avatarIds.map(async (avatarId) => {
      const lastBattle = await prisma.avatarBattle.findFirst({
        where: {
          status: BattleStatus.COMPLETE,
          OR: [{ challengerId: avatarId }, { opponentId: avatarId }],
        },
        orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
        select: { challengerId: true, opponentId: true },
      });
      if (!lastBattle) {
        opponentMap.set(avatarId, null);
        return;
      }
      const opponentId = lastBattle.challengerId === avatarId ? lastBattle.opponentId : lastBattle.challengerId;
      opponentMap.set(avatarId, opponentId);
    }),
  );
  return opponentMap;
}

export function getAvailableShopItems() {
  return SHOP_ITEMS;
}

export async function runAvatarBattleCycle() {
  const now = new Date();
  await releaseExpiredBattleLocks(now);
  const readyAvatars = await prisma.avatar.findMany({
    where: {
      inBattle: false,
      activeBattleId: null,
      battleLockExpiresAt: null,
      OR: [
        { status: AvatarStatus.SEARCHING },
        {
          status: AvatarStatus.COOLDOWN,
          lastBattleAt: { lt: new Date(now.getTime() - BATTLE_COOLDOWN_MS) },
        },
      ],
    },
    include: { user: { select: { id: true, username: true, image: true } } },
    orderBy: { lastBattleAt: "asc" },
    take: 40,
  });

  const queue = shuffle([...readyAvatars]);
  const lastOpponentMap = await getLastOpponentMap(queue.map((avatar) => avatar.id));
  while (queue.length > 0) {
    const challenger = queue.shift()!;
    if (queue.length === 0) {
      break;
    }
    const challengerLastOpponent = lastOpponentMap.get(challenger.id);
    let opponentIndex = -1;
    for (let index = 0; index < queue.length; index += 1) {
      const candidate = queue[index];
      if (candidate.id === challenger.id) {
        continue;
      }
      const candidateLastOpponent = lastOpponentMap.get(candidate.id);
      const challengerJustFoughtCandidate = challengerLastOpponent && candidate.id === challengerLastOpponent;
      const candidateJustFoughtChallenger = candidateLastOpponent && candidateLastOpponent === challenger.id;
      if (!challengerJustFoughtCandidate && !candidateJustFoughtChallenger) {
        opponentIndex = index;
        break;
      }
    }
    if (opponentIndex === -1) {
      opponentIndex = 0;
    }
    const opponent = queue.splice(opponentIndex, 1)[0];

    let battle;
    try {
      battle = await prisma.$transaction(async (tx) => {
        const createdBattle = await tx.avatarBattle.create({
          data: {
            challengerId: challenger.id,
            opponentId: opponent.id,
          },
        });

        const challengerLocked = await tx.avatar.updateMany({
          where: { id: challenger.id, activeBattleId: null },
          data: {
            inBattle: true,
            status: AvatarStatus.IN_BATTLE,
            activeBattleId: createdBattle.id,
            battleLockExpiresAt: null,
          },
        });
        if (challengerLocked.count !== 1) {
          throw new Error(`Avatar ${challenger.id} already in battle`);
        }

        if (opponent.id !== challenger.id) {
          const opponentLocked = await tx.avatar.updateMany({
            where: { id: opponent.id, activeBattleId: null },
            data: {
              inBattle: true,
              status: AvatarStatus.IN_BATTLE,
              activeBattleId: createdBattle.id,
              battleLockExpiresAt: null,
            },
          });
          if (opponentLocked.count !== 1) {
            throw new Error(`Avatar ${opponent.id} already in battle`);
          }
        }

        return createdBattle;
      });
    } catch (error) {
      console.warn("[Avatar Battle] Saltando batalla por avatar ocupado", error);
      continue;
    }

    lastOpponentMap.set(challenger.id, opponent.id);
    lastOpponentMap.set(opponent.id, challenger.id);

    const battleResult = simulateBattle(challenger, opponent);
    await prisma.$transaction(async (tx) => {
      const battleEndAt = new Date();
      const baseDurationMs = Math.max(1_000, battleResult.durationSeconds * 1000);
      const lockDurationMs = baseDurationMs + BATTLE_LOCK_PADDING_MS;
      const lockExpiresAt = new Date(battleEndAt.getTime() + lockDurationMs);
      await tx.avatarBattle.update({
        where: { id: battle.id },
        data: {
          status: BattleStatus.COMPLETE,
          winnerId: battleResult.winnerId,
          loserId: battleResult.loserId,
          firstStrikerId: battleResult.firstStrikerId,
          rounds: battleResult.rounds,
          log: battleResult.log,
          durationSeconds: battleResult.durationSeconds,
          completedAt: battleEndAt,
        },
      });

      const challengerDelta =
        (battleResult.winnerId === challenger.id ? 3 : 0) +
        (battleResult.loserId === challenger.id ? -1 : 0);
      await tx.avatar.update({
        where: { id: challenger.id },
        data: {
          currentHp: challenger.maxHp,
          lastBattleAt: battleEndAt,
          battleLockExpiresAt: lockExpiresAt,
          points: { increment: challengerDelta },
        },
      });

      if (opponent.id !== challenger.id) {
        const opponentDelta =
          (battleResult.winnerId === opponent.id ? 3 : 0) +
          (battleResult.loserId === opponent.id ? -1 : 0);
        await tx.avatar.update({
          where: { id: opponent.id },
          data: {
            currentHp: opponent.maxHp,
            lastBattleAt: battleEndAt,
            battleLockExpiresAt: lockExpiresAt,
            points: { increment: opponentDelta },
          },
        });
      }
    });

    console.log(
      `[Avatar Battle] ${battleResult.winnerName || "alias"} venció a ${battleResult.loserName || "alias"} en ${battleResult.rounds} rondas`,
    );
  }
}

interface BattleResult {
  winnerId: string;
  loserId: string;
  winnerName?: string;
  loserName?: string;
  firstStrikerId: string;
  rounds: number;
  durationSeconds: number;
  log: string;
}

function simulateBattle(challenger: AvatarWithUser, opponent: AvatarWithUser): BattleResult {
  const state = {
    [challenger.id]: { hp: challenger.currentHp, damage: challenger.damage },
    [opponent.id]: { hp: opponent.currentHp, damage: opponent.damage },
  };

  const firstStrikerId = Math.random() < 0.5 ? challenger.id : opponent.id;
  let attackerId = firstStrikerId;
  let defenderId = attackerId === challenger.id ? opponent.id : challenger.id;
  let rounds = 0;
  const lines: string[] = [
    `Moneda decide que ${attackerId === challenger.id ? challenger.user.username : opponent.user.username} pega primero.`,
  ];

  while (state[attackerId].hp > 0 && state[defenderId].hp > 0) {
    rounds += 1;
    state[defenderId].hp -= state[attackerId].damage;
    lines.push(
      `Ronda ${rounds}: ${(attackerId === challenger.id ? challenger.user.username : opponent.user.username)} daña y deja a ${(defenderId === challenger.id ? challenger.user.username : opponent.user.username)} con ${Math.max(
        state[defenderId].hp,
        0,
      )} de vida`,
    );

    if (state[defenderId].hp <= 0) {
      break;
    }

    [attackerId, defenderId] = [defenderId, attackerId];
  }

  const winnerId = state[attackerId].hp > 0 ? attackerId : defenderId;
  const loserId = winnerId === challenger.id ? opponent.id : challenger.id;
  const durationSeconds = rounds;
  lines.unshift(`Duración estimada: ${durationSeconds} segundos (1 golpe por segundo).`);

  return {
    winnerId,
    loserId,
    winnerName: (winnerId === challenger.id ? challenger.user.username : opponent.user.username) ?? "",
    loserName: (loserId === challenger.id ? challenger.user.username : opponent.user.username) ?? "",
    firstStrikerId,
    rounds,
    durationSeconds,
    log: lines.join("\n"),
  };
}
