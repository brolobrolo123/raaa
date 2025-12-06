import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireUser } from "@/lib/session";
import { promises as fs } from "fs";
import path from "path";
import { prepareUploadDirs, relativeUploadPath, resolveUploadPath } from "@/lib/uploads";
import { prisma } from "@/lib/prisma";
import { getAvailableForumPoints } from "@/lib/avatar/power";

const MAX_COVER_SIZE = 4 * 1024 * 1024; // 4 MB
const COVER_UPLOAD_FORUM_COST = 20;
const ALLOWED_TYPES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export async function POST(request: Request) {
  const session = await requireUser();
  const userId = session.user.id;

  const preflightPoints = await ensureCoverUploadPoints(userId);
  if (!preflightPoints.ok) {
    return coverPointsErrorResponse(preflightPoints.reason);
  }
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
    console.error("[cover upload] Invalid content-type", info);
    try {
      const logPath = path.join(process.cwd(), "tmp", "malformed-uploads.log");
      await fs.mkdir(path.dirname(logPath), { recursive: true });
      await fs.appendFile(logPath, JSON.stringify({ ts: new Date().toISOString(), ...info }) + "\n");
    } catch (err) {
      console.error("[cover upload] Failed to write malformed upload log", err);
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
    console.error("[cover upload] Malformed form data", info);
    try {
      const logPath = path.join(process.cwd(), "tmp", "malformed-uploads.log");
      await fs.mkdir(path.dirname(logPath), { recursive: true });
      await fs.appendFile(logPath, JSON.stringify({ ts: new Date().toISOString(), ...info }) + "\n");
    } catch (e) {
      console.error("[cover upload] Failed to write malformed upload log", e);
    }
    return NextResponse.json({ error: "Malformed form data" }, { status: 400 });
  }

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
  await prepareUploadDirs("covers");
  const fileName = `${Date.now()}-${randomUUID()}.${extension}`;
  const filePath = resolveUploadPath("covers", fileName);
  await fs.writeFile(filePath, bytes);

  const chargeResult = await chargeCoverUploadPoints(userId);
  if (!chargeResult.ok) {
    await fs.unlink(filePath).catch(() => {});
    return coverPointsErrorResponse(chargeResult.reason);
  }

  const relativePath = relativeUploadPath("covers", fileName);
  return NextResponse.json({ url: relativePath });
}

type CoverPointsErrorReason = "missing-avatar" | "insufficient";

async function ensureCoverUploadPoints(userId: string) {
  const avatar = await prisma.avatar.findUnique({
    where: { userId },
    select: { id: true, forumPointsSpent: true },
  });
  if (!avatar) {
    return { ok: false as const, reason: "missing-avatar" as const };
  }
  const available = await getAvailableForumPoints(userId, avatar.forumPointsSpent);
  if (available < COVER_UPLOAD_FORUM_COST) {
    return { ok: false as const, reason: "insufficient" as const };
  }
  return { ok: true as const };
}

class CoverPointsError extends Error {
  constructor(public reason: CoverPointsErrorReason) {
    super(reason);
    this.name = "CoverPointsError";
  }
}

async function chargeCoverUploadPoints(userId: string) {
  try {
    await prisma.$transaction(async (tx) => {
      const avatar = await tx.avatar.findUnique({
        where: { userId },
        select: { id: true, forumPointsSpent: true },
      });
      if (!avatar) {
        throw new CoverPointsError("missing-avatar");
      }
      const available = await getAvailableForumPoints(userId, avatar.forumPointsSpent, tx);
      if (available < COVER_UPLOAD_FORUM_COST) {
        throw new CoverPointsError("insufficient");
      }
      await tx.avatar.update({
        where: { id: avatar.id },
        data: { forumPointsSpent: { increment: COVER_UPLOAD_FORUM_COST } },
      });
    });
    return { ok: true as const };
  } catch (error) {
    if (error instanceof CoverPointsError) {
      return { ok: false as const, reason: error.reason };
    }
    throw error;
  }
}

function coverPointsErrorResponse(reason: CoverPointsErrorReason) {
  const message =
    reason === "missing-avatar"
      ? "Necesitas crear tu avatar antes de subir portadas."
      : `Necesitas ${COVER_UPLOAD_FORUM_COST} puntos del foro para subir una portada.`;
  return NextResponse.json({ error: message }, { status: 400 });
}
