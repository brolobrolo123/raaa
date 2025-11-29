import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { requireUser } from "@/lib/session";

const MAX_COVER_SIZE = 4 * 1024 * 1024; // 4 MB
const ALLOWED_TYPES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export async function POST(request: Request) {
  await requireUser();
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Archivo inválido" }, { status: 400 });
  }

  if (file.size === 0 || file.size > MAX_COVER_SIZE) {
    return NextResponse.json({ error: "La portada debe pesar menos de 4 MB" }, { status: 400 });
  }

  const extension = ALLOWED_TYPES.get(file.type);
  if (!extension) {
    return NextResponse.json({ error: "Formato no soportado" }, { status: 415 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const uploadDir = path.join(process.cwd(), "public", "uploads", "covers");
  await fs.mkdir(uploadDir, { recursive: true });
  const fileName = `${Date.now()}-${randomUUID()}.${extension}`;
  const filePath = path.join(uploadDir, fileName);
  await fs.writeFile(filePath, bytes);

  const relativePath = `/uploads/covers/${fileName}`;
  return NextResponse.json({ url: relativePath });
}
