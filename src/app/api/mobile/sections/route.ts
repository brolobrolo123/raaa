import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SECTION_DEFINITIONS, SECTION_SLUGS } from "@/lib/sections";

const articleSelect = {
  id: true,
  title: true,
  summary: true,
  score: true,
  createdAt: true,
  author: { select: { username: true } },
  _count: { select: { comments: true } },
};

export async function GET() {
  const sections = await prisma.section.findMany({
    where: { slug: { in: SECTION_SLUGS } },
    select: { id: true, slug: true, name: true, description: true, accentColor: true },
    orderBy: { name: "asc" },
  });
  const sectionMap = new Map(sections.map((section) => [section.slug, section]));

  const payload = await Promise.all(
    SECTION_SLUGS.map(async (slug) => {
      const definition = SECTION_DEFINITIONS[slug];
      const dbSection = sectionMap.get(slug);
      if (!dbSection) {
        return {
          slug,
          name: definition.name.es,
          description: definition.description.es,
          tagline: definition.tagline.es,
          accentColor: definition.accentColor,
          articles: [],
        };
      }

      const articles = await prisma.article.findMany({
        where: { sectionId: dbSection.id },
        orderBy: [
          { score: "desc" },
          { createdAt: "desc" },
        ],
        take: 3,
        select: articleSelect,
      });

      return {
        slug,
        name: dbSection.name,
        description: dbSection.description,
        tagline: definition.tagline.es,
        accentColor: dbSection.accentColor,
        articles: articles.map((article) => ({
          id: article.id,
          title: article.title,
          summary: article.summary,
          score: article.score,
          comments: article._count.comments,
          createdAt: article.createdAt.toISOString(),
          author: article.author.username,
        })),
      };
    }),
  );

  return NextResponse.json(payload);
}
