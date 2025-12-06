import "dotenv/config";
import type { Locale } from "../src/lib/i18n/dictionaries";
import { SECTION_DEFINITIONS } from "../src/lib/sections";
import { CLUB_DEFINITIONS } from "../src/lib/clubs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined");
}

const sanitizedUrl = (() => {
  try {
    const url = new URL(databaseUrl);
    url.searchParams.delete("sslmode");
    return url.toString();
  } catch {
    return databaseUrl;
  }
})();

const pool = new Pool({
  connectionString: sanitizedUrl,
  ssl: { rejectUnauthorized: false },
});

const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

type SectionSlug = keyof typeof SECTION_DEFINITIONS;

const DEFAULT_LOCALE: Locale = "es";

async function main() {
  for (const [slug, value] of Object.entries(SECTION_DEFINITIONS)) {
    await prisma.section.upsert({
      where: { slug: slug as SectionSlug },
      update: {
        name: value.name[DEFAULT_LOCALE],
        description: value.description[DEFAULT_LOCALE],
        accentColor: value.accentColor,
      },
      create: {
        slug: slug as SectionSlug,
        name: value.name[DEFAULT_LOCALE],
        description: value.description[DEFAULT_LOCALE],
        accentColor: value.accentColor,
      },
    });
  }

  for (const club of Object.values(CLUB_DEFINITIONS)) {
    await prisma.club.upsert({
      where: { slug: club.slug },
      update: {
        name: club.name,
        description: club.description,
        tagline: club.tagline,
        icon: club.icon,
        accentColor: club.accentColor,
        heroGradient: club.heroGradient,
        welcomeMessage: club.welcomeMessage,
        rules: club.rules,
      },
      create: {
        slug: club.slug,
        name: club.name,
        description: club.description,
        tagline: club.tagline,
        icon: club.icon,
        accentColor: club.accentColor,
        heroGradient: club.heroGradient,
        welcomeMessage: club.welcomeMessage,
        rules: club.rules,
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
