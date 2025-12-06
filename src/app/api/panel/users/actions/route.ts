import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { sendModerationAlertNotification, sendModerationPenaltyNotification } from "@/lib/notifications";
import { isModeratorRole, isOwnerRole } from "@/lib/moderation";

type ActionPayload = {
  userId?: string;
  action?: "ban" | "unban" | "silence" | "warn";
  durationMinutes?: number;
  reason?: string;
  permanent?: boolean;
};

export async function POST(request: Request) {
  const session = await requireUser();
  if (!isModeratorRole(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const payload: ActionPayload = await request.json().catch(() => ({}));
  const { userId, action, durationMinutes, reason } = payload;

  if (!userId || !action) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  if (target.role === "OWNER" && !isOwnerRole(session.user.role)) {
    return NextResponse.json({ error: "No puedes modificar al dueño" }, { status: 403 });
  }

  const now = new Date();
  switch (action) {
    case "ban": {
      const isPermanent = Boolean(payload.permanent);
      if (!reason) {
        return NextResponse.json({ error: "Especifica duración y motivo" }, { status: 400 });
      }
      if (!isPermanent && (!durationMinutes || durationMinutes <= 0)) {
        return NextResponse.json({ error: "Especifica duración y motivo" }, { status: 400 });
      }

      const banEnd = isPermanent ? null : new Date(now.getTime() + durationMinutes! * 60 * 1000);
      await prisma.user.update({
        where: { id: userId },
        data: {
          bannedUntil: banEnd,
          banReason: reason,
          permanentBan: isPermanent,
        },
      });

      await prisma.userBan.create({
        data: {
          userId,
          issuedById: session.user.id,
          startAt: now,
          endAt: banEnd,
          permanent: isPermanent,
          reason,
        },
      });

      return NextResponse.json({ success: true });
    }
    case "unban": {
      await prisma.user.update({
        where: { id: userId },
        data: { bannedUntil: null, banReason: null, permanentBan: false },
      });

      const activeBan = await prisma.userBan.findFirst({
        where: {
          userId,
          OR: [{ endAt: { gt: now } }, { permanent: true }],
        },
        orderBy: { startAt: "desc" },
      });

      if (activeBan) {
        await prisma.userBan.update({
          where: { id: activeBan.id },
          data: { endAt: now, permanent: false },
        });
      }

      return NextResponse.json({ success: true });
    }
    case "silence": {
      if (!durationMinutes || durationMinutes <= 0 || !reason) {
        return NextResponse.json({ error: "Especifica duración y motivo" }, { status: 400 });
      }
      await prisma.user.update({
        where: { id: userId },
        data: {
          silencedUntil: new Date(now.getTime() + durationMinutes * 60 * 1000),
          silenceReason: reason,
        },
      });
      return NextResponse.json({ success: true });
    }
    case "warn": {
      if (!reason) {
        return NextResponse.json({ error: "Especifica una advertencia" }, { status: 400 });
      }

      await prisma.userWarning.create({
        data: {
          userId,
          issuedById: session.user.id,
          reason,
        },
      });

      const totalWarnings = await prisma.userWarning.count({ where: { userId } });
      const alertIndex = totalWarnings % 3 === 0 ? 3 : totalWarnings % 3;
      await sendModerationAlertNotification({ userId, actorId: session.user.id, alertIndex });

      if (totalWarnings % 3 === 0) {
        const banUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const banReason = "Acumuló tres alertas";
        await prisma.user.update({
          where: { id: userId },
          data: { bannedUntil: banUntil, banReason },
        });
        await prisma.userBan.create({
          data: {
            userId,
            issuedById: session.user.id,
            startAt: now,
            endAt: banUntil,
            reason: banReason,
          },
        });
        await sendModerationPenaltyNotification({ userId, actorId: session.user.id });
      }

      return NextResponse.json({ success: true });
    }
    default:
      return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  }
}
