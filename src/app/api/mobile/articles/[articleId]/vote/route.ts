import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractUserIdFromRequest } from "@/lib/mobile-token";

type RouteContext = {
  params: Promise<{ articleId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const userId = await extractUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { articleId } = await context.params;

  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { score: true },
  });

  if (!article) {
    return NextResponse.json({ error: "Artículo no encontrado" }, { status: 404 });
  }

  const existing = await prisma.articleVote.findUnique({
    where: {
      articleId_userId: {
        articleId,
        userId,
      },
    },
    select: { id: true, value: true },
  });

  let newScore = article.score;

  if (existing) {
    await prisma.$transaction([
      prisma.articleVote.delete({ where: { id: existing.id } }),
      prisma.article.update({
        where: { id: articleId },
        data: { score: { decrement: existing.value } },
      }),
    ]);

    newScore -= existing.value;
    return NextResponse.json({ score: newScore, liked: false });
  }

  await prisma.$transaction([
    prisma.articleVote.create({
      data: {
        articleId,
        userId,
        value: 1,
      },
    }),
    prisma.article.update({
      where: { id: articleId },
      data: { score: { increment: 1 } },
    }),
  ]);

  newScore += 1;

  return NextResponse.json({ score: newScore, liked: true });
}
