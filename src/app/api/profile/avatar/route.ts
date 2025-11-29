import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export async function POST(request: Request) {
  const session = await requireUser();
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Archivo inválido" }, { status: 400 });
  }

  if (file.size === 0 || file.size > MAX_AVATAR_SIZE) {
    return NextResponse.json({ error: "Usa una imagen de menos de 2 MB" }, { status: 400 });
  }

  const extension = ALLOWED_TYPES.get(file.type);
  if (!extension) {
    return NextResponse.json({ error: "Formato no soportado" }, { status: 415 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
  await fs.mkdir(uploadDir, { recursive: true });
  const fileName = `${session.user.id}-${Date.now()}-${randomUUID()}.${extension}`;
  const filePath = path.join(uploadDir, fileName);
  await fs.writeFile(filePath, bytes);

  const relativePath = `/uploads/avatars/${fileName}`;
  const existing = await prisma.user.findUnique({ where: { id: session.user.id }, select: { image: true } });
  if (existing?.image && existing.image.startsWith("/uploads/avatars/") && existing.image !== relativePath) {
    const previousPath = path.join(process.cwd(), "public", existing.image);
    await fs.unlink(previousPath).catch(() => undefined);
  }

  await prisma.user.update({ where: { id: session.user.id }, data: { image: relativePath } });

  return NextResponse.json({ url: relativePath });
}
