import { prisma } from "@/lib/prisma";

const CHAT_MESSAGE_MAX_LENGTH = 280;
const BATTLE_CHAT_MAX_MESSAGES = 100;
const GLOBAL_CHAT_MAX_MESSAGES = 100;

export async function isBattleParticipant(battleId: string, avatarId: string) {
  if (!battleId || !avatarId) return false;
  const battle = await prisma.avatarBattle.findUnique({
    where: { id: battleId },
    select: { challengerId: true, opponentId: true },
  });
  if (!battle) return false;
  return battle.challengerId === avatarId || battle.opponentId === avatarId;
}

export async function getBattleChatMessages(battleId: string) {
  if (!battleId) return [];
  return prisma.avatarBattleChatMessage.findMany({
    where: { battleId },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { username: true, image: true } } },
  });
}

export async function createBattleChatMessage(battleId: string, authorId: string, body: string) {
  const sanitized = sanitizeMessage(body);
  if (!sanitized) {
    throw new Error("Mensaje vacío");
  }
  const message = await prisma.avatarBattleChatMessage.create({
    data: { battleId, authorId, body: sanitized },
    include: { author: { select: { username: true, image: true } } },
  });
  await pruneBattleChat(battleId);
  return message;
}

export async function getGlobalChatMessages(limit = GLOBAL_CHAT_MAX_MESSAGES) {
  const messages = await prisma.globalChatMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.max(1, Math.min(limit, GLOBAL_CHAT_MAX_MESSAGES)),
    include: { author: { select: { username: true, image: true } } },
  });
  return messages.reverse();
}

export async function createGlobalChatMessage(authorId: string, body: string) {
  const sanitized = sanitizeMessage(body);
  if (!sanitized) {
    throw new Error("Mensaje vacío");
  }
  const message = await prisma.globalChatMessage.create({
    data: { authorId, body: sanitized },
    include: { author: { select: { username: true, image: true } } },
  });
  await pruneGlobalChat();
  return message;
}

async function pruneBattleChat(battleId: string) {
  const overflow = await prisma.avatarBattleChatMessage.findMany({
    where: { battleId },
    orderBy: { createdAt: "desc" },
    skip: BATTLE_CHAT_MAX_MESSAGES,
    take: BATTLE_CHAT_MAX_MESSAGES,
    select: { id: true },
  });
  if (overflow.length === 0) return;
  await prisma.avatarBattleChatMessage.deleteMany({ where: { id: { in: overflow.map((row) => row.id) } } });
}

async function pruneGlobalChat() {
  const overflow = await prisma.globalChatMessage.findMany({
    orderBy: { createdAt: "desc" },
    skip: GLOBAL_CHAT_MAX_MESSAGES,
    take: GLOBAL_CHAT_MAX_MESSAGES,
    select: { id: true },
  });
  if (overflow.length === 0) return;
  await prisma.globalChatMessage.deleteMany({ where: { id: { in: overflow.map((row) => row.id) } } });
}

function sanitizeMessage(input: string) {
  return input.trim().slice(0, CHAT_MESSAGE_MAX_LENGTH);
}
