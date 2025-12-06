import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { normalizeSpriteColors, normalizeSpriteEntry } from "@/lib/pixel-avatar";
import { getDefaultFabSpriteSerialized, saveDefaultFabSprite } from "@/lib/site-settings";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const sprite = await getDefaultFabSpriteSerialized();
  return NextResponse.json({ sprite });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
  }

  const spritePayload = (payload as Record<string, unknown>)?.sprite;
  if (!spritePayload) {
    return NextResponse.json({ error: "Sprite requerido" }, { status: 400 });
  }

  let parsedSprite;
  try {
    if (typeof spritePayload === "string") {
      parsedSprite = normalizeSpriteEntry(JSON.parse(spritePayload));
    } else {
      parsedSprite = normalizeSpriteEntry(spritePayload);
    }
  } catch {
    return NextResponse.json({ error: "Sprite inválido" }, { status: 400 });
  }

  const normalized = normalizeSpriteColors(parsedSprite);
  const serialized = await saveDefaultFabSprite(normalized);

  return NextResponse.json({ sprite: serialized });
}
