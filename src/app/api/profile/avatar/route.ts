import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { prepareUploadDirs, relativeUploadPath, resolveExistingUpload, resolveUploadPath } from "@/lib/uploads";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export async function POST(request: Request) {
  const session = await requireUser();
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    const info = {
      reason: "invalid-content-type",
      url: request.url,
      method: request.method,
      contentType,
      forwarded: request.headers.get("x-forwarded-for"),
      referer: request.headers.get("referer"),
      ua: request.headers.get("user-agent"),
    };
    console.error("[avatar upload] Invalid content-type", info);
    try {
      const logPath = path.join(process.cwd(), "tmp", "malformed-uploads.log");
      await fs.mkdir(path.dirname(logPath), { recursive: true });
      await fs.appendFile(logPath, JSON.stringify({ ts: new Date().toISOString(), ...info }) + "\n");
    } catch (err) {
      console.error("[avatar upload] Failed to write malformed upload log", err);
    }
    return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (err) {
    const info = {
      reason: "malformed-form-data",
      url: request.url,
      method: request.method,
      contentType,
      forwarded: request.headers.get("x-forwarded-for"),
      referer: request.headers.get("referer"),
      ua: request.headers.get("user-agent"),
      error: String(err),
    };
    console.error("[avatar upload] Malformed form data", info);
    try {
      const logPath = path.join(process.cwd(), "tmp", "malformed-uploads.log");
      await fs.mkdir(path.dirname(logPath), { recursive: true });
      await fs.appendFile(logPath, JSON.stringify({ ts: new Date().toISOString(), ...info }) + "\n");
    } catch (e) {
      console.error("[avatar upload] Failed to write malformed upload log", e);
    }
    return NextResponse.json({ error: "Malformed form data" }, { status: 400 });
  }

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
  await prepareUploadDirs("avatars");
  const fileName = `${session.user.id}-${Date.now()}-${randomUUID()}.${extension}`;
  const filePath = resolveUploadPath("avatars", fileName);
  await fs.writeFile(filePath, bytes);

  const relativePath = relativeUploadPath("avatars", fileName);
  const existing = await prisma.user.findUnique({ where: { id: session.user.id }, select: { image: true } });
  if (existing?.image && existing.image.startsWith("/uploads/avatars/") && existing.image !== relativePath) {
    const previousPath = resolveExistingUpload(existing.image);
    if (previousPath) {
      await fs.unlink(previousPath).catch(() => undefined);
    }
  }

  await prisma.user.update({ where: { id: session.user.id }, data: { image: relativePath } });

  return NextResponse.json({ url: relativePath });
}
