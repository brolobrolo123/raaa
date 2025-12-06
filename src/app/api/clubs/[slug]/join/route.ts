import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getActiveClubDisciplineState } from "@/lib/club-service";

export async function POST(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const [session, { slug }] = await Promise.all([requireUser(), context.params]);

  const club = await prisma.club.findUnique({ where: { slug } });
  if (!club) {
    return NextResponse.json({ error: "Club no encontrado" }, { status: 404 });
  }

  const discipline = await getActiveClubDisciplineState(club.id, session.user.id);
  if (discipline.isBanned) {
    return NextResponse.json({
      error: "No puedes unirte porque estás baneado de este club.",
    }, { status: 403 });
  }
  if (discipline.suspendedUntil) {
    return NextResponse.json({
      error: "Tu acceso al club está suspendido temporalmente.",
    }, { status: 403 });
  }

  const membership = await prisma.clubMembership.upsert({
    where: {
      clubId_userId: {
        clubId: club.id,
        userId: session.user.id,
      },
    },
    update: {},
    create: {
      clubId: club.id,
      userId: session.user.id,
      role: "MEMBER",
    },
  });

  return NextResponse.json({
    success: true,
    membership: {
      role: membership.role,
      joinedAt: membership.joinedAt.toISOString(),
    },
  });
}
