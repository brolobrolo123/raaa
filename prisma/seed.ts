import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import type { Locale } from "../src/lib/i18n/dictionaries";
import { SECTION_DEFINITIONS } from "../src/lib/sections";

type SectionSlug = keyof typeof SECTION_DEFINITIONS;

const prisma = new PrismaClient();
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
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
