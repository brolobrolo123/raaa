import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { ensureAvatarForUser } from "@/lib/avatar/engine";
import { createBattleChatMessage, getBattleChatMessages, isBattleParticipant } from "@/lib/avatar/chat";

export async function GET(request: NextRequest) {
  const session = await requireUser();
  const avatar = await ensureAvatarForUser(session.user.id);
  const battleId = new URL(request.url).searchParams.get("battleId");
  if (!battleId) {
    return NextResponse.json({ error: "battleId requerido" }, { status: 400 });
  }
  const allowed = await isBattleParticipant(battleId, avatar.id);
  if (!allowed) {
    return NextResponse.json({ error: "Batalla no encontrada" }, { status: 404 });
  }
  const messages = await getBattleChatMessages(battleId);
  return NextResponse.json({ messages });
}

export async function POST(request: NextRequest) {
  const session = await requireUser();
  const avatar = await ensureAvatarForUser(session.user.id);
  const payload = await request.json().catch(() => null);
  const battleId = typeof payload?.battleId === "string" ? payload.battleId : null;
  const message = typeof payload?.message === "string" ? payload.message : null;
  if (!battleId || !message) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const allowed = await isBattleParticipant(battleId, avatar.id);
  if (!allowed) {
    return NextResponse.json({ error: "Batalla no encontrada" }, { status: 404 });
  }
  try {
    const record = await createBattleChatMessage(battleId, session.user.id, message);
    return NextResponse.json({ message: record });
  } catch {
    return NextResponse.json({ error: "No se pudo enviar el mensaje" }, { status: 400 });
  }
}
