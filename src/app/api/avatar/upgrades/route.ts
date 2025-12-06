import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getProfilePointValue } from "@/lib/avatar/power";
import {
  DAMAGE_INCREMENT,
  EVASION_INCREMENT,
  HP_INCREMENT,
  UPGRADE_LIMITS,
  getNextUpgradeCost,
  type UpgradeType,
} from "@/lib/avatar/upgrade-config";

const UPGRADE_FIELDS: Record<UpgradeType, "hpUpgrades" | "damageUpgrades" | "evasionUpgrades"> = {
  hp: "hpUpgrades",
  damage: "damageUpgrades",
  evasion: "evasionUpgrades",
};

type AvatarUpgradeFields = Pick<
  Prisma.AvatarUpdateInput,
  "currentHp" | "maxHp" | "damage" | "evasion" | "forumPointsSpent" | "hpUpgrades" | "damageUpgrades" | "evasionUpgrades"
>;

export async function POST(request: Request) {
  const session = await requireUser();
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
  }
  const type = (payload as { type?: string })?.type as UpgradeType | undefined;
  if (!type || !(type in UPGRADE_FIELDS)) {
    return NextResponse.json({ error: "Mejora inválida" }, { status: 400 });
  }

  const avatar = await prisma.avatar.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      points: true,
      forumPointsSpent: true,
      maxHp: true,
      currentHp: true,
      damage: true,
      evasion: true,
      hpUpgrades: true,
      damageUpgrades: true,
      evasionUpgrades: true,
    },
  });

  if (!avatar) {
    return NextResponse.json({ error: "Avatar no encontrado" }, { status: 404 });
  }

  const upgradeField = UPGRADE_FIELDS[type];
  const currentLevel = avatar[upgradeField];
  const maxLevels = UPGRADE_LIMITS[type];
  if (currentLevel >= maxLevels) {
    return NextResponse.json({ error: "Llegaste al límite de mejoras para este atributo." }, { status: 400 });
  }
  const nextCost = getNextUpgradeCost(type, currentLevel);
  if (nextCost === null) {
    return NextResponse.json({ error: "No hay más mejoras disponibles." }, { status: 400 });
  }
  const profilePoints = await getProfilePointValue(session.user.id);
  const availableForumPoints = Math.max(0, profilePoints - avatar.forumPointsSpent);
  if (availableForumPoints < nextCost) {
    return NextResponse.json({ error: "No tienes suficientes puntos para esta mejora." }, { status: 400 });
  }

  const data: AvatarUpgradeFields = {
    forumPointsSpent: { increment: nextCost },
  };

  switch (type) {
    case "hp": {
      const nextMaxHp = avatar.maxHp + HP_INCREMENT;
      const nextCurrentHp = Math.min(avatar.currentHp + HP_INCREMENT, nextMaxHp);
      data.maxHp = nextMaxHp;
      data.currentHp = nextCurrentHp;
      data.hpUpgrades = { increment: 1 };
      break;
    }
    case "damage": {
      data.damage = avatar.damage + DAMAGE_INCREMENT;
      data.damageUpgrades = { increment: 1 };
      break;
    }
    case "evasion": {
      data.evasion = avatar.evasion + EVASION_INCREMENT;
      data.evasionUpgrades = { increment: 1 };
      break;
    }
    default:
      return NextResponse.json({ error: "Tipo de mejora no soportado" }, { status: 400 });
  }

  const updated = await prisma.avatar.update({
    where: { id: avatar.id },
    data,
    select: {
      forumPointsSpent: true,
      maxHp: true,
      currentHp: true,
      damage: true,
      evasion: true,
      hpUpgrades: true,
      damageUpgrades: true,
      evasionUpgrades: true,
    },
  });
  const updatedAvailablePoints = Math.max(0, profilePoints - updated.forumPointsSpent);

  return NextResponse.json({
    stats: {
      upgradePoints: updatedAvailablePoints,
      forumPoints: updatedAvailablePoints,
      maxHp: updated.maxHp,
      currentHp: updated.currentHp,
      damage: updated.damage,
      evasion: updated.evasion,
      hpUpgrades: updated.hpUpgrades,
      damageUpgrades: updated.damageUpgrades,
      evasionUpgrades: updated.evasionUpgrades,
    },
  });
}
