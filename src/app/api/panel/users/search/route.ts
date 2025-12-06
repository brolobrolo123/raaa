import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { isModeratorRole } from "@/lib/moderation";

export async function GET(request: Request) {
  const session = await requireUser();
  if (!isModeratorRole(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const url = new URL(request.url);
  const username = url.searchParams.get("username")?.trim() ?? null;
  if (!username) {
    return NextResponse.json({ error: "Escribe un usuario" }, { status: 400 });
  }

  const users = await prisma.user.findMany({
    where: { username: { contains: username, mode: "insensitive" } },
    orderBy: { username: "asc" },
    take: 6,
    select: {
      id: true,
      username: true,
      role: true,
      bannedUntil: true,
      silencedUntil: true,
      permanentBan: true,
      avatar: {
        select: {
          id: true,
          currentHp: true,
          maxHp: true,
          damage: true,
          evasion: true,
        },
      },
      receivedWarnings: {
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          reason: true,
          createdAt: true,
          issuedBy: { select: { username: true } },
        },
      },
      bans: {
        orderBy: { startAt: "desc" },
        take: 6,
        select: {
          id: true,
          reason: true,
          startAt: true,
          endAt: true,
          permanent: true,
          issuedBy: { select: { username: true } },
        },
      },
      _count: {
        select: { receivedWarnings: true },
      },
    },
  });

  const normalized = users.map((user) => ({
    id: user.id,
    username: user.username,
    role: user.role,
    bannedUntil: user.bannedUntil?.toISOString() ?? null,
    silencedUntil: user.silencedUntil?.toISOString() ?? null,
    permanentBan: user.permanentBan,
    avatar: user.avatar
      ? {
          id: user.avatar.id,
          currentHp: user.avatar.currentHp,
          maxHp: user.avatar.maxHp,
          damage: user.avatar.damage,
          evasion: user.avatar.evasion,
        }
      : null,
    warningCount: user._count.receivedWarnings,
    warnings: user.receivedWarnings.map((warning) => ({
      id: warning.id,
      reason: warning.reason,
      createdAt: warning.createdAt.toISOString(),
      issuer: warning.issuedBy.username ?? "Desconocido",
    })),
    bans: user.bans.map((ban) => ({
      id: ban.id,
      reason: ban.reason,
      startAt: ban.startAt.toISOString(),
      endAt: ban.endAt?.toISOString() ?? null,
      permanent: ban.permanent,
      issuer: ban.issuedBy.username ?? "Desconocido",
    })),
  }));

  return NextResponse.json({ users: normalized });
}
