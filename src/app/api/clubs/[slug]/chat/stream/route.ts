import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getActiveClubDisciplineState, getClubMessageFeed, getClubPollViews } from "@/lib/club-service";
import { registerClubChatStream } from "@/lib/club-chat-stream";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const [session, { slug }] = await Promise.all([requireUser(), context.params]);

  const club = await prisma.club.findUnique({ where: { slug } });
  if (!club) {
    return NextResponse.json({ error: "Club no encontrado" }, { status: 404 });
  }

  const discipline = await getActiveClubDisciplineState(club.id, session.user.id);
  if (discipline.isBanned || discipline.suspendedUntil) {
    return NextResponse.json({ error: "Acceso restringido" }, { status: 403 });
  }

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const send = async () => {
    const [messages, polls] = await Promise.all([
      getClubMessageFeed(club.id),
      getClubPollViews(club.id, session.user.id),
    ]);
    await writer.write(encoder.encode(`data: ${JSON.stringify({ messages, polls })}\n\n`));
  };

  await send();

  const heartbeat = setInterval(() => {
    void send();
  }, 15000);

  const close = () => {
    clearInterval(heartbeat);
    writer.close().catch(() => undefined);
  };

  const unregister = registerClubChatStream(club.id, async () => {
    try {
      await send();
    } catch {
      unregister();
      close();
    }
  });

  request.signal.addEventListener("abort", () => {
    unregister();
    close();
  });

  return new NextResponse(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
