import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const MIN_VALUE = 1;
const MAX_HP_LIMIT = 5000;
const MAX_DAMAGE_LIMIT = 500;
const MAX_EVASION_LIMIT = 95;

type Payload = {
  userId?: string;
  avatarId?: string;
  maxHp?: number;
  currentHp?: number;
  damage?: number;
  evasion?: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export async function POST(request: Request) {
  const session = await requireUser();
  if (session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Solo el dueño puede editar atributos" }, { status: 403 });
  }

  const payload: Payload = await request.json().catch(() => ({}));
  const { userId, avatarId } = payload;

  if (!userId && !avatarId) {
    return NextResponse.json({ error: "Identifica al avatar" }, { status: 400 });
  }

  const target = await prisma.avatar.findFirst({
    where: avatarId ? { id: avatarId } : { userId: userId! },
    select: { id: true, currentHp: true, maxHp: true, damage: true, evasion: true },
  });

  if (!target) {
    return NextResponse.json({ error: "Avatar no encontrado" }, { status: 404 });
  }

  const nextData: Record<string, number> = {};

  if (typeof payload.maxHp === "number" && !Number.isNaN(payload.maxHp)) {
    nextData.maxHp = clamp(Math.round(payload.maxHp), MIN_VALUE, MAX_HP_LIMIT);
  }

  if (typeof payload.damage === "number" && !Number.isNaN(payload.damage)) {
    nextData.damage = clamp(Math.round(payload.damage), MIN_VALUE, MAX_DAMAGE_LIMIT);
  }

  if (typeof payload.evasion === "number" && !Number.isNaN(payload.evasion)) {
    nextData.evasion = clamp(Math.round(payload.evasion), 0, MAX_EVASION_LIMIT);
  }

  if (typeof payload.currentHp === "number" && !Number.isNaN(payload.currentHp)) {
    nextData.currentHp = clamp(Math.round(payload.currentHp), MIN_VALUE, nextData.maxHp ?? target.maxHp);
  }

  if (!Object.keys(nextData).length) {
    return NextResponse.json({ error: "No hay cambios" }, { status: 400 });
  }

  if (nextData.maxHp && !nextData.currentHp) {
    nextData.currentHp = Math.min(target.currentHp, nextData.maxHp);
  }

  const updated = await prisma.avatar.update({
    where: { id: target.id },
    data: nextData,
    select: { id: true, currentHp: true, maxHp: true, damage: true, evasion: true },
  });

  return NextResponse.json({ avatar: updated });
}
