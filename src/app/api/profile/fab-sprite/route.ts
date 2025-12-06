import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  FabSpriteCollection,
  normalizeSpriteColors,
  parseFabSpriteCollection,
  serializeFabSpriteCollection,
} from "@/lib/pixel-avatar";
import { serializePixelSprite } from "@/lib/pixel-avatar";
import { getDefaultFabSpriteSerialized } from "@/lib/site-settings";
import { buildSpriteClaims, DuplicateMonochromeColorError, type PixelClaimInput } from "@/lib/pixel-claims";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { fabPixelSprite: true },
  });
  const fallbackSprite = await getDefaultFabSpriteSerialized();
  return NextResponse.json({ sprite: user?.fabPixelSprite ?? fallbackSprite });
}

export async function PUT(request: Request) {
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

  const collectionPayload = (payload as Record<string, unknown>)?.collection ?? (payload as Record<string, unknown>)?.sprite;
  if (!collectionPayload) {
    return NextResponse.json({ error: "Sprite inválido" }, { status: 400 });
  }

  let parsedCollection: FabSpriteCollection;
  if (typeof collectionPayload === "string") {
    parsedCollection = parseFabSpriteCollection(collectionPayload);
  } else if (typeof collectionPayload === "object" && collectionPayload !== null) {
    parsedCollection = parseFabSpriteCollection(JSON.stringify(collectionPayload));
  } else {
    return NextResponse.json({ error: "Sprite inválido" }, { status: 400 });
  }

  const normalizedCollection: FabSpriteCollection = {
    activeSlot: parsedCollection.activeSlot,
    designs: parsedCollection.designs.map((design) => normalizeSpriteColors(design)),
    unlockedSlots: parsedCollection.unlockedSlots,
  };

  const serialized = serializeFabSpriteCollection(normalizedCollection);
  const defaultCollection = parseFabSpriteCollection(await getDefaultFabSpriteSerialized());
  const defaultSignature = serializePixelSprite(defaultCollection.designs[defaultCollection.activeSlot]);

  let claims: PixelClaimInput[] = [];
  try {
    claims = buildSpriteClaims(normalizedCollection.designs, defaultSignature);
  } catch (error) {
    if (error instanceof DuplicateMonochromeColorError) {
      return NextResponse.json(
        { error: "Ese color ya está reservado para un casco o armadura completamente sólido." },
        { status: 400 },
      );
    }
    throw error;
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.user.id },
        data: { fabPixelSprite: serialized },
      });
      await tx.pixelColorClaim.deleteMany({ where: { userId: session.user.id } });
      if (claims.length > 0) {
        await tx.pixelColorClaim.createMany({
          data: claims.map((claim) => ({
            userId: session.user.id,
            slotIndex: claim.slotIndex,
            region: claim.region,
            pixelIndex: claim.pixelIndex,
            color: claim.color,
          })),
        });
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Ese diseño ya está reservado por otro avatar. Ajusta los colores o utiliza la silueta base." },
        { status: 409 },
      );
    }
    throw error;
  }

  return NextResponse.json({ sprite: serialized });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const fallbackSprite = await getDefaultFabSpriteSerialized();

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: session.user.id },
      data: { fabPixelSprite: fallbackSprite },
    });
    await tx.pixelColorClaim.deleteMany({ where: { userId: session.user.id } });
  });

  return NextResponse.json({ sprite: fallbackSprite });
}
