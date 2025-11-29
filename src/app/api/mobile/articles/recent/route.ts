import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { extractUserIdFromRequest } from "@/lib/mobile-token";

const articleSelect = {
  id: true,
  title: true,
  summary: true,
  score: true,
  createdAt: true,
  section: { select: { slug: true, name: true } },
  author: { select: { username: true } },
  _count: { select: { comments: true } },
};

export async function GET(request: Request) {
  const userId = await extractUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const rawLimit = Number(url.searchParams.get("limit") ?? 3);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.floor(rawLimit), 1), 10) : 3;

  const articles = await prisma.article.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: limit,
    select: articleSelect,
  });

  return NextResponse.json(
    articles.map((article) => ({
      id: article.id,
      title: article.title,
      summary: article.summary,
      score: article.score,
      comments: article._count.comments,
      createdAt: article.createdAt.toISOString(),
      section: article.section,
      author: article.author?.username ?? null,
    })),
  );
}
