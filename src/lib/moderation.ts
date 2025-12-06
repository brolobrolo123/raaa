import { prisma } from "@/lib/prisma";
import type { Role } from "@/types/roles";

const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;
const MINUTES_IN_HUNDRED_HOURS = 100 * 60;

export async function ensureModeratorRequestOnActivity(userId: string, articleCount: number) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || user.role !== "USER") {
    return;
  }

  const existing = await prisma.moderatorRequest.findUnique({ where: { userId } });
  if (existing && existing.status === "PENDING") {
    return;
  }

  const oneMonthAgo = new Date(Date.now() - THIRTY_DAYS_MS);
  const usage = await prisma.userActivity.aggregate({
    where: { userId, recordedAt: { gte: oneMonthAgo } },
    _sum: { durationMinutes: true },
  });
  const recentMinutes = usage._sum.durationMinutes ?? 0;
  const qualifiesByHours = recentMinutes >= MINUTES_IN_HUNDRED_HOURS;
  const qualifiesByArticles = articleCount >= 100;
  if (!qualifiesByHours && !qualifiesByArticles) {
    return;
  }

  await prisma.moderatorRequest.upsert({
    where: { userId },
    update: { status: "PENDING", updatedAt: new Date() },
    create: { userId, status: "PENDING" },
  });

  await prisma.notification.create({
    data: {
      userId,
      actorId: userId,
      type: "moderation_invite",
      message: "¡Estás listo para solicitar el rango de moderador! Visita el panel y envía tu solicitud.",
    },
  });
}

export function isModeratorRole(role?: Role) {
  return role === "MODERATOR" || role === "ADMIN" || role === "OWNER";
}

export function isAdminRole(role?: Role) {
  return role === "ADMIN" || role === "OWNER";
}

export function isOwnerRole(role?: Role) {
  return role === "OWNER";
}
