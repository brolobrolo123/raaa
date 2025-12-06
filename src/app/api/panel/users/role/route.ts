import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import type { Role } from "@/types/roles";
import { isOwnerRole } from "@/lib/moderation";

const ASSIGNABLE_ROLES: Role[] = ["USER", "MODERATOR", "ADMIN"];

type RolePayload = {
  userId?: string;
  role?: Role;
};

export async function POST(request: Request) {
  const session = await requireUser();
  if (!isOwnerRole(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const payload: RolePayload = await request.json().catch(() => ({}));
  const { userId, role } = payload;

  if (!userId || !role || !ASSIGNABLE_ROLES.includes(role)) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  if (userId === session.user.id) {
    return NextResponse.json({ error: "No puedes cambiar tu propio rol" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  await prisma.user.update({ where: { id: userId }, data: { role } });
  return NextResponse.json({ success: true });
}
