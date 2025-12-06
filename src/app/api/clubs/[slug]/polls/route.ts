import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getActiveClubDisciplineState, getClubPollViews } from "@/lib/club-service";
import { broadcastClubChatUpdate } from "@/lib/club-chat-stream";

const MAX_QUESTION_LENGTH = 200;
const MAX_OPTION_LENGTH = 80;
const MIN_DURATION_MINUTES = 5;
const MAX_DURATION_MINUTES = 10080; // 7 días
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 5;

type PollPayload = {
  question?: string;
  options?: unknown;
  durationMinutes?: number;
};

function sanitizePollOptions(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .slice(0, MAX_OPTIONS)
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0 && entry.length <= MAX_OPTION_LENGTH);
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

  const polls = await getClubPollViews(club.id, session.user.id);
  return NextResponse.json({ polls });
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const [session, { slug }] = await Promise.all([requireUser(), context.params]);
  const payload: PollPayload = await request.json().catch(() => ({}));

  const question = (payload.question ?? "").trim();
  if (!question) {
    return NextResponse.json({ error: "La pregunta es obligatoria." }, { status: 400 });
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return NextResponse.json({ error: "La pregunta es demasiado larga." }, { status: 400 });
  }

  const options = sanitizePollOptions(payload.options);
  if (options.length < MIN_OPTIONS) {
    return NextResponse.json({ error: "Necesitas al menos dos opciones." }, { status: 400 });
  }

  const durationMinutes = Number(payload.durationMinutes);
  if (!Number.isFinite(durationMinutes)) {
    return NextResponse.json({ error: "Duración no válida." }, { status: 400 });
  }
  if (durationMinutes < MIN_DURATION_MINUTES || durationMinutes > MAX_DURATION_MINUTES) {
    return NextResponse.json({ error: "La duración de la encuesta es inválida." }, { status: 400 });
  }

  const club = await prisma.club.findUnique({ where: { slug } });
  if (!club) {
    return NextResponse.json({ error: "Club no encontrado" }, { status: 404 });
  }

  const [membership, discipline] = await Promise.all([
    prisma.clubMembership.findUnique({
      where: {
        clubId_userId: {
          clubId: club.id,
          userId: session.user.id,
        },
      },
    }),
    getActiveClubDisciplineState(club.id, session.user.id),
  ]);

  const role = membership?.role;
  if (!membership || (role !== "MODERATOR" && role !== "OWNER")) {
    return NextResponse.json({ error: "No tienes permisos para crear encuestas." }, { status: 403 });
  }
  if (discipline.isBanned || discipline.suspendedUntil) {
    return NextResponse.json({ error: "Tu acceso al club está restringido." }, { status: 403 });
  }

  const roundedDuration = Math.round(durationMinutes);
  const expiresAt = new Date(Date.now() + roundedDuration * 60_000);

  const created = await prisma.clubPoll.create({
    data: {
      clubId: club.id,
      createdById: session.user.id,
      question,
      options,
      durationMinutes: roundedDuration,
      expiresAt,
    },
  });

  const polls = await getClubPollViews(club.id, session.user.id);
  const pollView = polls.find((poll) => poll.id === created.id) ?? null;

  broadcastClubChatUpdate(club.id);

  return NextResponse.json({ poll: pollView }, { status: 201 });
}
