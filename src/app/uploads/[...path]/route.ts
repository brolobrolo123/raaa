import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { detectMimeType, prepareUploadDirs, resolveUploadPath, type UploadKind } from "@/lib/uploads";

const ALLOWED_KINDS: UploadKind[] = ["avatars", "covers", "avatar-backgrounds"];

export async function GET(_request: Request, context: { params: Promise<{ path?: string[] }> }) {
  const { path: pathSegments = [] } = await context.params;
  if (!Array.isArray(pathSegments) || pathSegments.length < 2) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }

  const [kind, ...rest] = pathSegments;
  if (!ALLOWED_KINDS.includes(kind as UploadKind)) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }

  const safeParts = rest.join("/");
  if (!safeParts || safeParts.includes("..")) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }

  await prepareUploadDirs(kind as UploadKind);
  const fileName = path.basename(safeParts);
  const filePath = resolveUploadPath(kind as UploadKind, safeParts);

  let fileBuffer: Buffer;
  try {
    fileBuffer = await fs.readFile(filePath);
  } catch {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }

  const mime = detectMimeType(fileName);
  return new NextResponse(fileBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
