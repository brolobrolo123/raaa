import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getActiveClubDisciplineState, getClubPollViews } from "@/lib/club-service";
import { broadcastClubChatUpdate } from "@/lib/club-chat-stream";

function normalizeStoredOptions(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);
}

export async function POST(request: Request, context: { params: Promise<{ slug: string; pollId: string }> }) {
  const [session, { slug, pollId }] = await Promise.all([requireUser(), context.params]);
  const payload = await request.json().catch(() => ({}));
  const optionIndex = typeof payload.optionIndex === "number" ? payload.optionIndex : Number(payload.optionIndex);

  if (!Number.isInteger(optionIndex)) {
    return NextResponse.json({ error: "Opción inválida." }, { status: 400 });
  }

  const club = await prisma.club.findUnique({ where: { slug } });
  if (!club) {
    return NextResponse.json({ error: "Club no encontrado" }, { status: 404 });
  }

  const [membership, discipline, poll] = await Promise.all([
    prisma.clubMembership.findUnique({
      where: {
        clubId_userId: {
          clubId: club.id,
          userId: session.user.id,
        },
      },
    }),
    getActiveClubDisciplineState(club.id, session.user.id),
    prisma.clubPoll.findUnique({ where: { id: pollId } }),
  ]);

  if (!membership) {
    return NextResponse.json({ error: "Debes unirte al club para votar." }, { status: 403 });
  }
  if (discipline.isBanned || discipline.suspendedUntil) {
    return NextResponse.json({ error: "Tu acceso al club está restringido." }, { status: 403 });
  }
  if (!poll || poll.clubId !== club.id) {
    return NextResponse.json({ error: "Encuesta no encontrada." }, { status: 404 });
  }
  if (poll.expiresAt && poll.expiresAt <= new Date()) {
    return NextResponse.json({ error: "La encuesta ya finalizó." }, { status: 400 });
  }

  const options = normalizeStoredOptions(poll.options);
  if (optionIndex < 0 || optionIndex >= options.length) {
    return NextResponse.json({ error: "Opción inválida." }, { status: 400 });
  }

  await prisma.clubPollVote.upsert({
    where: {
      pollId_userId: {
        pollId: poll.id,
        userId: session.user.id,
      },
    },
    update: {
      optionIndex,
    },
    create: {
      pollId: poll.id,
      userId: session.user.id,
      optionIndex,
    },
  });

  const polls = await getClubPollViews(club.id, session.user.id);
  const updated = polls.find((entry) => entry.id === poll.id) ?? null;

  broadcastClubChatUpdate(club.id);

  return NextResponse.json({ poll: updated });
}
