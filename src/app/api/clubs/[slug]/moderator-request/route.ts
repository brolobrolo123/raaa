import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getProfilePointValue } from "@/lib/avatar/power";
import { getActiveClubDisciplineState } from "@/lib/club-service";

const MIN_FORUM_POINTS = 100;

type ModeratorRequestPayload = {
  discord?: string;
  motivation?: string;
};

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const [session, { slug }] = await Promise.all([requireUser(), context.params]);
  const payload: ModeratorRequestPayload = await request.json().catch(() => ({}));
  const discord = (payload.discord ?? "").trim();
  const motivation = (payload.motivation ?? "").trim();

  if (discord.length < 3 || discord.length > 80) {
    return NextResponse.json({ error: "Proporciona tu usuario de Discord." }, { status: 400 });
  }
  if (motivation.length < 20 || motivation.length > 600) {
    return NextResponse.json({ error: "Explica por qué quieres moderar (20-600 caracteres)." }, { status: 400 });
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
    return NextResponse.json({ error: "Debes ser miembro del club para aplicar." }, { status: 403 });
  }

  const discipline = await getActiveClubDisciplineState(club.id, session.user.id);
  if (discipline.isBanned || discipline.suspendedUntil) {
    return NextResponse.json({ error: "No puedes aplicar mientras tengas sanciones activas." }, { status: 403 });
  }

  const forumPoints = await getProfilePointValue(session.user.id);
  if (forumPoints < MIN_FORUM_POINTS) {
    return NextResponse.json({ error: `Necesitas al menos ${MIN_FORUM_POINTS} puntos del foro.` }, { status: 400 });
  }

  await prisma.clubModeratorRequest.upsert({
    where: {
      clubId_userId: {
        clubId: club.id,
        userId: session.user.id,
      },
    },
    update: {
      discord,
      motivation,
      status: "PENDING",
      reviewedAt: null,
      reviewerId: null,
      moderationNotes: null,
    },
    create: {
      clubId: club.id,
      userId: session.user.id,
      discord,
      motivation,
      status: "PENDING",
    },
  });

  return NextResponse.json({ success: true });
}
