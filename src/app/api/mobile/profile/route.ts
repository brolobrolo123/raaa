import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractUserIdFromRequest } from "@/lib/mobile-token";

export async function GET(request: Request) {
  const userId = await extractUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      image: true,
      bio: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const [articles, comments, score, publications] = await Promise.all([
    prisma.article.count({ where: { authorId: userId } }),
    prisma.comment.count({ where: { authorId: userId } }),
    prisma.article.aggregate({
      where: { authorId: userId },
      _sum: { score: true },
    }),
    prisma.article.findMany({
      where: { authorId: userId },
      orderBy: [{ createdAt: "desc" }],
      take: 10,
      select: {
        id: true,
        title: true,
        summary: true,
        score: true,
        createdAt: true,
        section: { select: { name: true, slug: true } },
        _count: { select: { comments: true } },
      },
    }),
  ]);

  return NextResponse.json({
    user: {
      ...user,
      createdAt: user.createdAt.toISOString(),
    },
    stats: {
      articles,
      comments,
      score: score._sum.score ?? 0,
    },
    publications: publications.map((article) => ({
      id: article.id,
      title: article.title,
      summary: article.summary,
      score: article.score,
      comments: article._count.comments,
      createdAt: article.createdAt.toISOString(),
      section: {
        name: article.section.name,
        slug: article.section.slug,
      },
    })),
  });
}
