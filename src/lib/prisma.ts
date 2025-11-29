import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import path from "node:path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const resolveSqliteUrl = () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL is not defined");
  if (!dbUrl.startsWith("file:")) {
    throw new Error("Only file: URLs are supported for the SQLite adapter");
  }

  const relativePath = dbUrl.replace(/^file:/, "");
  const absolutePath = path.isAbsolute(relativePath)
    ? relativePath
    : path.resolve(process.cwd(), relativePath);
  const normalizedPath = absolutePath.split(path.sep).join("/");

  return `file:${normalizedPath}`;
};

const createPrismaClient = () => {
  const adapter = new PrismaBetterSqlite3({ url: resolveSqliteUrl() });
  return new PrismaClient({ adapter });
};

const prismaClient = globalForPrisma.prisma ?? createPrismaClient();
export { prismaClient as prisma };

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prismaClient;
}
