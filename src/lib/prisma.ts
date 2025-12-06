import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined");
}

const { sanitizedConnectionString, shouldUseSSL } = (() => {
  try {
    const url = new URL(databaseUrl);
    url.searchParams.delete("sslmode");
    const host = url.hostname;
    const requiresSslEnv = process.env.DATABASE_SSL?.toLowerCase() === "require";
    const isLocalHost = host === "localhost" || host === "127.0.0.1";
    return {
      sanitizedConnectionString: url.toString(),
      shouldUseSSL: requiresSslEnv || !isLocalHost,
    };
  } catch {
    return {
      sanitizedConnectionString: databaseUrl,
      shouldUseSSL: process.env.DATABASE_SSL?.toLowerCase() === "require",
    };
  }
})();

const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString: sanitizedConnectionString,
    ssl: shouldUseSSL ? { rejectUnauthorized: false } : undefined,
  });
const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter: new PrismaPg(pool) });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}

export { prisma };
