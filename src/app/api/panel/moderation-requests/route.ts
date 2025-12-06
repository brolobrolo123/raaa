import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { isAdminRole } from "@/lib/moderation";

type RequestPayload = {
  requestId?: string;
  action?: "approve" | "reject";
};

export async function POST(request: Request) {
  const session = await requireUser();
  if (!isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const payload: RequestPayload = await request.json().catch(() => ({}));
  const { requestId, action } = payload;

  if (!requestId || !action) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const target = await prisma.moderatorRequest.findUnique({ where: { id: requestId }, include: { user: true } });
  if (!target) {
    return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
  }

  const updated = await prisma.moderatorRequest.update({
    where: { id: requestId },
    data: { status: action === "approve" ? "APPROVED" : "REJECTED" },
  });

  await prisma.notification.create({
    data: {
      userId: target.userId,
      actorId: session.user.id,
      type: "moderation_request_status",
      message:
        action === "approve"
          ? "Tu solicitud ha sido aprobada. Un administrador te contactará para coordinar el paso a moderador."
          : "Tu solicitud ha sido rechazada. Gracias por tu interés.",
    },
  });

  return NextResponse.json({ success: true, status: updated.status });
}
