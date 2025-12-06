import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { isAdminRole } from "@/lib/moderation";

const MIN_DURATION_MINUTES = 5;
const MAX_DURATION_MINUTES = 10080; // 7 days

type ModerationActionPayload = {
  targetUserId?: string;
  action?: "ban" | "silence" | "suspend";
  durationMinutes?: number;
  reason?: string;
};

function validateDuration(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }
  if (value < MIN_DURATION_MINUTES) {
    return MIN_DURATION_MINUTES;
  }
  if (value > MAX_DURATION_MINUTES) {
    return MAX_DURATION_MINUTES;
  }
  return Math.round(value);
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const [session, { slug }] = await Promise.all([requireUser(), context.params]);
  const payload: ModerationActionPayload = await request.json().catch(() => ({}));
  const targetUserId = payload.targetUserId;
  const action = payload.action;

  if (!targetUserId || !action) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }
  if (targetUserId === session.user.id) {
    return NextResponse.json({ error: "No puedes moderarte a ti mismo." }, { status: 400 });
  }

  const club = await prisma.club.findUnique({ where: { slug } });
  if (!club) {
    return NextResponse.json({ error: "Club no encontrado" }, { status: 404 });
  }

  const [actorMembership, targetMembership] = await Promise.all([
    prisma.clubMembership.findUnique({
      where: {
        clubId_userId: {
          clubId: club.id,
          userId: session.user.id,
        },
      },
    }),
    prisma.clubMembership.findUnique({
      where: {
        clubId_userId: {
          clubId: club.id,
          userId: targetUserId,
        },
      },
    }),
  ]);

  const isClubModerator = actorMembership?.role === "MODERATOR" || actorMembership?.role === "OWNER";
  const isGlobalModerator = isAdminRole(session.user.role);
  if (!isClubModerator && !isGlobalModerator) {
    return NextResponse.json({ error: "No tienes permisos para moderar este club." }, { status: 403 });
  }

  if (targetMembership?.role === "OWNER") {
    return NextResponse.json({ error: "No puedes actuar contra el dueño del club." }, { status: 403 });
  }
  if (targetMembership?.role === "MODERATOR" && !(actorMembership?.role === "OWNER" || isGlobalModerator)) {
    return NextResponse.json({ error: "Solo el dueño del club o administradores globales pueden moderar a otros moderadores." }, { status: 403 });
  }

  const reason = (payload.reason ?? "").slice(0, 240);

  let expiresAt: Date | null = null;
  if (action === "silence" || action === "suspend") {
    const normalized = validateDuration(payload.durationMinutes);
    if (!normalized) {
      return NextResponse.json({ error: "Debes indicar una duración en minutos." }, { status: 400 });
    }
    expiresAt = new Date(Date.now() + normalized * 60_000);
  } else if (payload.durationMinutes) {
    const normalized = validateDuration(payload.durationMinutes);
    if (normalized) {
      expiresAt = new Date(Date.now() + normalized * 60_000);
    }
  }

  await prisma.$transaction(async (tx) => {
    if (action === "ban" || action === "suspend") {
      await tx.clubMembership.deleteMany({ where: { clubId: club.id, userId: targetUserId } });
    }

    const type = action === "ban" ? "BAN" : action === "silence" ? "SILENCE" : "SUSPENSION";
    await tx.clubDiscipline.deleteMany({ where: { clubId: club.id, userId: targetUserId, type } });
    await tx.clubDiscipline.create({
      data: {
        clubId: club.id,
        userId: targetUserId,
        issuedById: session.user.id,
        type,
        reason: reason || null,
        expiresAt,
      },
    });
  });

  return NextResponse.json({ success: true });
}
