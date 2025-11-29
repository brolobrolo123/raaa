import { NextResponse } from "next/server";
import { getSectionSnapshot } from "@/lib/article-service";
import { SECTION_DEFINITIONS, SECTION_SLUGS, type SectionSlug } from "@/lib/sections";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

const VALID_VIEWS = new Set(["default", "top", "recent"]);

type SnapshotArticle = Awaited<ReturnType<typeof getSectionSnapshot>> extends infer Snapshot
  ? Snapshot extends { topArticles: Array<infer ArticleType> }
    ? ArticleType & {
        topComment?: {
          body: string;
          score: number;
          author: {
            username: string;
          };
        } | null;
      }
    : never
  : never;

function serializeArticle(article: SnapshotArticle) {
  return {
    id: article.id,
    title: article.title,
    summary: article.summary,
    score: article.score,
    comments: article._count.comments,
    createdAt: article.createdAt.toISOString(),
    author: article.author.username,
    topComment: article.topComment
      ? {
          body: article.topComment.body,
          score: article.topComment.score,
          author: article.topComment.author.username,
        }
      : null,
  };
}

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  if (!SECTION_SLUGS.includes(slug as SectionSlug)) {
    return NextResponse.json({ error: "Sección no encontrada" }, { status: 404 });
  }

  const url = new URL(request.url);
  const viewParam = url.searchParams.get("view") ?? "default";
  const normalizedView = VALID_VIEWS.has(viewParam) ? (viewParam as "default" | "top" | "recent") : "default";

  const snapshot = await getSectionSnapshot({ slug: slug as SectionSlug, view: normalizedView });
  if (!snapshot) {
    return NextResponse.json({ error: "Sección no encontrada" }, { status: 404 });
  }

  const definition = SECTION_DEFINITIONS[slug as SectionSlug];

  return NextResponse.json({
    section: {
      slug,
      name: snapshot.section.name,
      description: snapshot.section.description,
      tagline: definition.tagline.es,
      accentColor: snapshot.section.accentColor,
    },
    topArticles: snapshot.topArticles.map(serializeArticle),
    recentArticles: snapshot.recentArticles.map(serializeArticle),
    hasMoreRecent: snapshot.hasMoreRecent,
    view: snapshot.view,
  });
}
