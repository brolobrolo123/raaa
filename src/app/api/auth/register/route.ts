import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import { createAvatarOnRegistration } from "@/lib/avatar/engine";
import { getDefaultFabSpriteSerialized } from "@/lib/site-settings";
import { parseFabSpriteCollection, serializeFabSpriteCollection, serializePixelSprite } from "@/lib/pixel-avatar";
import { buildSpriteClaims, DuplicateMonochromeColorError, type PixelClaimInput } from "@/lib/pixel-claims";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  const requestedFabSprite = typeof body?.fabSprite === "string" ? body.fabSprite : null;

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.format() },
      { status: 400 },
    );
  }

  const username = parsed.data.username.trim().toLowerCase();
  const email = parsed.data.email.trim().toLowerCase();

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email }],
    },
    select: { id: true, username: true, email: true },
  });

  if (existing) {
    const duplicatedField = existing.username === username ? "usuario" : "correo";
    return NextResponse.json(
      { error: `El ${duplicatedField} ya está registrado.` },
      { status: 409 },
    );
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 12);

  const defaultSprite = await getDefaultFabSpriteSerialized();
  const defaultCollection = parseFabSpriteCollection(defaultSprite);
  const defaultSignature = serializePixelSprite(defaultCollection.designs[defaultCollection.activeSlot]);

  const requestedCollection = requestedFabSprite
    ? parseFabSpriteCollection(requestedFabSprite)
    : defaultCollection;
  const sanitizedSprite = serializeFabSpriteCollection(requestedCollection);

  let claims: PixelClaimInput[] = [];
  try {
    claims = buildSpriteClaims(requestedCollection.designs, defaultSignature);
  } catch (error) {
    if (error instanceof DuplicateMonochromeColorError) {
      return NextResponse.json(
        { error: "Ese color ya está reservado para un casco o armadura completamente sólido." },
        { status: 400 },
      );
    }
    throw error;
  }

  let createdUser;
  try {
    createdUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username,
          email,
          hashedPassword,
          fabPixelSprite: sanitizedSprite,
        },
        select: { id: true },
      });

      if (claims.length > 0) {
        await tx.pixelColorClaim.createMany({
          data: claims.map((claim) => ({
            userId: user.id,
            slotIndex: claim.slotIndex,
            region: claim.region,
            pixelIndex: claim.pixelIndex,
            color: claim.color,
          })),
        });
      }

      return user;
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

  // create avatar for the new user
  try {
    if (createdUser) {
      await createAvatarOnRegistration(createdUser.id);
    }
  } catch (err) {
    console.error("Failed to create avatar on registration:", err);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
