import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { createGlobalChatMessage, getGlobalChatMessages } from "@/lib/avatar/chat";

export async function GET() {
  await requireUser();
  const messages = await getGlobalChatMessages();
  return NextResponse.json({ messages });
}

export async function POST(request: NextRequest) {
  const session = await requireUser();
  const payload = await request.json().catch(() => null);
  const message = typeof payload?.message === "string" ? payload.message : null;
  if (!message) {
    return NextResponse.json({ error: "Mensaje requerido" }, { status: 400 });
  }
  try {
    const record = await createGlobalChatMessage(session.user.id, message);
    return NextResponse.json({ message: record });
  } catch {
    return NextResponse.json({ error: "No se pudo enviar el mensaje" }, { status: 400 });
  }
}
