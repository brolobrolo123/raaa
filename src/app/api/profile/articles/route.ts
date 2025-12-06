import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PROFILE_ARTICLES_PAGE_SIZE, type SerializedProfileArticle } from "@/lib/profile-articles";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const pageParam = Number(url.searchParams.get("page") ?? "0");
  const page = Number.isNaN(pageParam) ? 0 : Math.max(0, pageParam);
  const take = PROFILE_ARTICLES_PAGE_SIZE;
  const skip = page * take;

  const [articles, totalCount] = await Promise.all([
    prisma.article.findMany({
      where: { authorId: session.user.id },
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        title: true,
        summary: true,
        createdAt: true,
        score: true,
        section: { select: { name: true, slug: true } },
      },
    }),
    prisma.article.count({ where: { authorId: session.user.id } }),
  ]);

  const serialized: SerializedProfileArticle[] = articles.map((article) => ({
    ...article,
    createdAt: article.createdAt.toISOString(),
  }));

  const hasMore = skip + serialized.length < totalCount;

  return NextResponse.json({
    articles: serialized,
    hasMore,
  });
}
