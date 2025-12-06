import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getActiveClubDisciplineState, getClubMessageFeed, getClubPollViews } from "@/lib/club-service";
import { broadcastClubChatUpdate } from "@/lib/club-chat-stream";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_ATTACHMENTS = 3;

type AttachmentPayload = {
  type?: string;
  url?: string;
  alt?: string;
};

type ChatPayload = {
  body?: string;
  attachments?: AttachmentPayload[];
};

function sanitizeAttachments(payload?: AttachmentPayload[]) {
  if (!payload || !Array.isArray(payload)) {
    return undefined;
  }

  const normalized = payload
    .slice(0, MAX_ATTACHMENTS)
    .map((item) => {
      const type = item.type === "gif" ? "gif" : item.type === "image" ? "image" : null;
      const url = typeof item.url === "string" ? item.url : null;
      if (!type || !url) {
        return null;
      }
      const alt = typeof item.alt === "string" ? item.alt : undefined;
      return { type, url, alt };
    })
    .filter((entry): entry is { type: "gif" | "image"; url: string; alt: string | undefined } => Boolean(entry));

  return normalized.length > 0 ? normalized : undefined;
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const [session, { slug }] = await Promise.all([requireUser(), context.params]);
  const payload: ChatPayload = await request.json().catch(() => ({}));
  const body = (payload.body ?? "").trim();

  if (!body) {
    return NextResponse.json({ error: "El mensaje no puede estar vacío." }, { status: 400 });
  }
  if (body.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: "El mensaje es demasiado largo." }, { status: 400 });
  }

  const club = await prisma.club.findUnique({ where: { slug } });
  if (!club) {
    return NextResponse.json({ error: "Club no encontrado" }, { status: 404 });
  }

  const membership = await prisma.clubMembership.findUnique({
    where: {
      clubId_userId: {
        clubId: club.id,
        userId: session.user.id,
      },
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Debes unirte al club para chatear." }, { status: 403 });
  }

  const discipline = await getActiveClubDisciplineState(club.id, session.user.id);
  if (discipline.isBanned || discipline.suspendedUntil) {
    return NextResponse.json({ error: "Tu acceso al club está restringido." }, { status: 403 });
  }
  if (discipline.mutedUntil) {
    return NextResponse.json({ error: "Estás silenciado y no puedes enviar mensajes." }, { status: 403 });
  }

  const attachments = sanitizeAttachments(payload.attachments);

  const message = await prisma.clubMessage.create({
    data: {
      clubId: club.id,
      authorId: session.user.id,
      body,
      attachments,
    },
    include: {
      author: { select: { id: true, username: true, image: true } },
    },
  });

  broadcastClubChatUpdate(club.id);

  return NextResponse.json({
    message: {
      id: message.id,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
      attachments,
      author: {
        id: message.author.id,
        username: message.author.username,
        image: message.author.image,
      },
    },
  });
}

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const [session, { slug }] = await Promise.all([requireUser(), context.params]);

  const club = await prisma.club.findUnique({ where: { slug } });
  if (!club) {
    return NextResponse.json({ error: "Club no encontrado" }, { status: 404 });
  }

  const discipline = await getActiveClubDisciplineState(club.id, session.user.id);
  if (discipline.isBanned || discipline.suspendedUntil) {
    return NextResponse.json({ error: "Acceso restringido" }, { status: 403 });
  }

  const [messages, polls] = await Promise.all([
    getClubMessageFeed(club.id),
    getClubPollViews(club.id, session.user.id),
  ]);
  return NextResponse.json({ messages, polls });
}
