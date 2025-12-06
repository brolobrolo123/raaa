import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function POST(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const [session, { slug }] = await Promise.all([requireUser(), context.params]);

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
    return NextResponse.json({ success: true });
  }

  if (membership.role === "OWNER") {
    return NextResponse.json({ error: "El dueño del club no puede salir." }, { status: 400 });
  }

  await prisma.clubMembership.delete({ where: { id: membership.id } });

  return NextResponse.json({ success: true });
}
