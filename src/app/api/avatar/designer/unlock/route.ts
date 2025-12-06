import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProfilePointValue } from "@/lib/avatar/power";
import { MAX_SPRITE_SLOTS, parseFabSpriteCollection, serializeFabSpriteCollection } from "@/lib/pixel-avatar";
import { getDefaultFabSpriteSerialized } from "@/lib/site-settings";

const UNLOCK_COST = 100;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
  }

  const slot = Number((payload as { slot?: number })?.slot);
  if (!Number.isInteger(slot) || slot < 0 || slot >= MAX_SPRITE_SLOTS) {
    return NextResponse.json({ error: "Espacio inválido" }, { status: 400 });
  }

  const [user, avatar] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { fabPixelSprite: true } }),
    prisma.avatar.findUnique({ where: { userId: session.user.id }, select: { id: true, forumPointsSpent: true } }),
  ]);

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  if (!avatar) {
    return NextResponse.json({ error: "Avatar no encontrado" }, { status: 404 });
  }

  const fallbackSprite = user.fabPixelSprite ?? (await getDefaultFabSpriteSerialized());
  const collection = parseFabSpriteCollection(fallbackSprite);

  if (collection.unlockedSlots >= MAX_SPRITE_SLOTS) {
    return NextResponse.json({ error: "Ya desbloqueaste todos los diseños." }, { status: 400 });
  }

  if (slot !== collection.unlockedSlots) {
    return NextResponse.json({ error: "Primero desbloquea el siguiente espacio en orden." }, { status: 400 });
  }

  const profilePoints = await getProfilePointValue(session.user.id);
  const availablePoints = Math.max(0, profilePoints - avatar.forumPointsSpent);

  if (availablePoints < UNLOCK_COST) {
    return NextResponse.json({ error: "No tienes puntos suficientes." }, { status: 400 });
  }

  const nextUnlockedSlots = Math.min(MAX_SPRITE_SLOTS, collection.unlockedSlots + 1);
  const updatedCollection = {
    ...collection,
    unlockedSlots: nextUnlockedSlots,
  };
  const serialized = serializeFabSpriteCollection(updatedCollection);

  const updatedAvatar = await prisma.$transaction(async (tx) => {
    const avatarUpdate = await tx.avatar.update({
      where: { id: avatar.id },
      data: { forumPointsSpent: { increment: UNLOCK_COST } },
      select: { forumPointsSpent: true },
    });

    await tx.user.update({
      where: { id: session.user.id },
      data: { fabPixelSprite: serialized },
    });

    return avatarUpdate;
  });

  const updatedAvailablePoints = Math.max(0, profilePoints - updatedAvatar.forumPointsSpent);

  return NextResponse.json({
    sprite: serialized,
    unlockedSlots: nextUnlockedSlots,
    availablePoints: updatedAvailablePoints,
  });
}
