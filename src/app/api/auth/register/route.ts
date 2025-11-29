import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.format() },
      { status: 400 },
    );
  }

  const username = parsed.data.username.toLowerCase();
  const email = parsed.data.email.toLowerCase();

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email }],
    },
    select: { id: true, username: true, email: true },
  });

  if (existing) {
    const duplicatedField = existing.username === username ? "usuario" : "correo";
    return NextResponse.json(
      { error: `El ${duplicatedField} ya está registrado.` },
      { status: 409 },
    );
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 12);

  await prisma.user.create({
    data: {
      username,
      email,
      hashedPassword,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
