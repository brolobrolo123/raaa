import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { getAvatarForUser } from "@/lib/avatar/engine";
import { getProfilePointValue } from "@/lib/avatar/power";

export async function GET() {
  const session = await requireUser();
  const avatar = await getAvatarForUser(session.user.id);
  if (!avatar) return NextResponse.json({ error: "No avatar" }, { status: 404 });
  const forumPointsTotalPromise = getProfilePointValue(avatar.user.id);

  let activeBattlePayload = null;
  if (avatar.activeBattle) {
    activeBattlePayload = {
      id: avatar.activeBattle.id,
      challengerId: avatar.activeBattle.challengerId,
      opponentId: avatar.activeBattle.opponentId,
      challenger: {
        id: avatar.activeBattle.challenger.id,
        maxHp: avatar.activeBattle.challenger.maxHp,
        damage: avatar.activeBattle.challenger.damage,
        evasion: avatar.activeBattle.challenger.evasion,
        points: avatar.activeBattle.challenger.points,
        hudBackgroundImage: avatar.activeBattle.challenger.hudBackgroundImage,
        user: avatar.activeBattle.challenger.user,
      },
      opponent: {
        id: avatar.activeBattle.opponent.id,
        maxHp: avatar.activeBattle.opponent.maxHp,
        damage: avatar.activeBattle.opponent.damage,
        evasion: avatar.activeBattle.opponent.evasion,
        points: avatar.activeBattle.opponent.points,
        hudBackgroundImage: avatar.activeBattle.opponent.hudBackgroundImage,
        user: avatar.activeBattle.opponent.user,
      },
    };
  }

  const forumPointsTotal = await forumPointsTotalPromise;
  const forumPointsAvailable = Math.max(0, forumPointsTotal - avatar.forumPointsSpent);
  return NextResponse.json({
    id: avatar.id,
    username: avatar.user.username,
    image: avatar.user.image,
    hudBackgroundImage: avatar.hudBackgroundImage,
    currentHp: avatar.currentHp,
    maxHp: avatar.maxHp,
    damage: avatar.damage,
    evasion: avatar.evasion,
    points: avatar.points,
    battlePoints: avatar.points,
    upgradePoints: forumPointsAvailable,
    forumPoints: forumPointsAvailable,
    forumPointsTotal,
    forumPointsSpent: avatar.forumPointsSpent,
    hpUpgrades: avatar.hpUpgrades,
    damageUpgrades: avatar.damageUpgrades,
    evasionUpgrades: avatar.evasionUpgrades,
    status: avatar.status,
    inBattle: avatar.inBattle,
    activeBattleId: avatar.activeBattleId,
    activeBattle: activeBattlePayload,
    battleLockExpiresAt: avatar.battleLockExpiresAt,
    lastBattleAt: avatar.lastBattleAt,
  });
}
