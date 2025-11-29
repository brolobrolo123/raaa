import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { SECTION_DEFINITIONS } from "../src/lib/sections";

type SectionSlug = keyof typeof SECTION_DEFINITIONS;

const prisma = new PrismaClient();

async function main() {
  for (const [slug, value] of Object.entries(SECTION_DEFINITIONS)) {
    await prisma.section.upsert({
      where: { slug: slug as SectionSlug },
      update: {
        name: value.name,
        description: value.description,
        accentColor: value.accentColor,
      },
      create: {
        slug: slug as SectionSlug,
        name: value.name,
        description: value.description,
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
