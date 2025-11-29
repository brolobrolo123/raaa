import { NextResponse } from "next/server";
import { getArticleWithMeta, getCommentBundle, serializeCommentNodes } from "@/lib/article-service";

type RouteContext = {
  params: Promise<{ articleId: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { articleId } = await context.params;
  const articleMeta = await getArticleWithMeta(articleId);

  if (!articleMeta) {
    return NextResponse.json({ error: "Artículo no encontrado" }, { status: 404 });
  }

  const commentsBundle = await getCommentBundle(articleId, "mix");

  return NextResponse.json({
    article: {
      id: articleMeta.article.id,
      title: articleMeta.article.title,
      summary: articleMeta.article.summary,
      content: articleMeta.article.content,
      createdAt: articleMeta.article.createdAt.toISOString(),
      score: articleMeta.article.score,
      comments: articleMeta.article._count.comments,
      coverColor: articleMeta.article.coverColor,
      section: {
        slug: articleMeta.article.section.slug,
        name: articleMeta.article.section.name,
      },
      author: {
        username: articleMeta.article.author?.username ?? "Anónimo",
        image: articleMeta.article.author?.image ?? null,
      },
    },
    comments: serializeCommentNodes(commentsBundle.comments),
  });
}
