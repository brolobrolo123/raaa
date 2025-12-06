import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { isAdminRole } from "@/lib/moderation";

interface ReviewPayload {
  requestId?: string;
  action?: "approve" | "reject";
}

export async function POST(request: Request) {
  const session = await requireUser();
  if (!isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const payload: ReviewPayload = await request.json().catch(() => ({}));
  const { requestId, action } = payload;
  if (!requestId || !action) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const target = await prisma.clubModeratorRequest.findUnique({
    where: { id: requestId },
    include: {
      user: { select: { id: true, username: true } },
      club: { select: { id: true, name: true } },
    },
  });

  if (!target) {
    return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
  }

  if (target.status !== "PENDING") {
    return NextResponse.json({ error: "La solicitud ya fue revisada." }, { status: 400 });
  }

  if (action === "approve") {
    await prisma.$transaction(async (tx) => {
      await tx.clubModeratorRequest.update({
        where: { id: target.id },
        data: {
          status: "APPROVED",
          reviewerId: session.user.id,
          reviewedAt: new Date(),
        },
      });

      await tx.clubMembership.upsert({
        where: {
          clubId_userId: {
            clubId: target.clubId,
            userId: target.userId,
          },
        },
        update: { role: "MODERATOR" },
        create: {
          clubId: target.clubId,
          userId: target.userId,
          role: "MODERATOR",
        },
      });

      await tx.notification.create({
        data: {
          userId: target.userId,
          actorId: session.user.id,
          type: "club_moderator_request",
          message: `Tu solicitud para moderar ${target.club.name} fue aprobada.`,
        },
      });
    });
  } else {
    await prisma.$transaction(async (tx) => {
      await tx.clubModeratorRequest.update({
        where: { id: target.id },
        data: {
          status: "REJECTED",
          reviewerId: session.user.id,
          reviewedAt: new Date(),
        },
      });
      await tx.notification.create({
        data: {
          userId: target.userId,
          actorId: session.user.id,
          type: "club_moderator_request",
          message: `Tu solicitud para moderar ${target.club.name} fue rechazada.`,
        },
      });
    });
  }

  return NextResponse.json({ success: true });
}
