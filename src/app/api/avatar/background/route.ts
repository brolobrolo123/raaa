import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ensureAvatarForUser } from "@/lib/avatar/engine";
import { resolveExistingUpload } from "@/lib/uploads";
import { HUD_BACKGROUND_PRESETS } from "@/data/hud-backgrounds";

export async function POST(request: Request) {
  const session = await requireUser();
  const payload = await request.json().catch(() => null);
  const backgroundId = payload?.backgroundId as string | undefined;
  if (!backgroundId) {
    return NextResponse.json({ error: "Selecciona un fondo" }, { status: 400 });
  }

  const preset = HUD_BACKGROUND_PRESETS.find((item) => item.id === backgroundId);
  if (!preset) {
    return NextResponse.json({ error: "Fondo no disponible" }, { status: 404 });
  }

  const avatar = await ensureAvatarForUser(session.user.id);
  await prisma.avatar.update({ where: { id: avatar.id }, data: { hudBackgroundImage: preset.src } });
  return NextResponse.json({ url: preset.src });
}

export async function DELETE() {
  const session = await requireUser();
  const avatar = await ensureAvatarForUser(session.user.id);
  const current = avatar.hudBackgroundImage;
  if (current && current.startsWith("/uploads/avatar-backgrounds/")) {
    const previousPath = resolveExistingUpload(current);
    if (previousPath) {
      await fs.unlink(previousPath).catch(() => undefined);
    }
  }
  await prisma.avatar.update({ where: { id: avatar.id }, data: { hudBackgroundImage: null } });
  return NextResponse.json({ ok: true });
}
