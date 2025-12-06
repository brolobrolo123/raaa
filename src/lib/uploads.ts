import { promises as fs } from "fs";
import path from "path";

const UPLOAD_KINDS = ["avatars", "covers", "avatar-backgrounds"] as const;
type UploadKind = (typeof UPLOAD_KINDS)[number];

const LEGACY_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const UPLOADS_BASE = path.resolve(process.env.UPLOADS_DIR ?? path.join(process.cwd(), "storage", "uploads"));

let legacyMigrated = false;

async function pathExists(target: string) {
  try {
    await fs.stat(target);
    return true;
  } catch {
    return false;
  }
}

async function migrateLegacyUploads() {
  if (legacyMigrated) {
    return;
  }
  legacyMigrated = true;
  if (!(await pathExists(LEGACY_UPLOAD_DIR))) {
    return;
  }

  for (const kind of UPLOAD_KINDS) {
    const legacyKindPath = path.join(LEGACY_UPLOAD_DIR, kind);
    if (!(await pathExists(legacyKindPath))) {
      continue;
    }
    await fs.mkdir(path.join(UPLOADS_BASE, kind), { recursive: true });
    const entries = await fs.readdir(legacyKindPath);
    await Promise.all(
      entries.map(async (entry) => {
        const source = path.join(legacyKindPath, entry);
        const destination = path.join(UPLOADS_BASE, kind, entry);
        try {
          await fs.rename(source, destination);
        } catch {
          await fs.copyFile(source, destination);
          await fs.unlink(source).catch(() => undefined);
        }
      }),
    );
  }

  await fs.rm(LEGACY_UPLOAD_DIR, { recursive: true, force: true }).catch(() => undefined);
}

async function ensureKindDirectory(kind: UploadKind) {
  await fs.mkdir(path.join(UPLOADS_BASE, kind), { recursive: true });
}

export async function prepareUploadDirs(kind: UploadKind) {
  await fs.mkdir(UPLOADS_BASE, { recursive: true });
  await ensureKindDirectory(kind);
  await migrateLegacyUploads();
}

export function resolveUploadPath(kind: UploadKind, fileName: string) {
  return path.join(UPLOADS_BASE, kind, fileName);
}

export function relativeUploadPath(kind: UploadKind, fileName: string) {
  return `/uploads/${kind}/${fileName}`;
}

export function resolveExistingUpload(relativePath: string) {
  if (!relativePath.startsWith("/uploads/")) {
    return null;
  }
  const segments = relativePath.replace(/^\/+/, "").split("/");
  const [, kind, ...rest] = segments;
  if (!kind || !UPLOAD_KINDS.includes(kind as UploadKind) || rest.length === 0) {
    return null;
  }
  return path.join(UPLOADS_BASE, kind, rest.join("/"));
}

export function detectMimeType(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();
  switch (extension) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

export type { UploadKind };
