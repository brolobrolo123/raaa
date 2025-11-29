import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

interface VoteParams {
  params: Promise<{ articleId: string }>;
}

export async function POST(_request: Request, context: VoteParams) {
  const session = await requireUser();
  const { articleId } = await context.params;

  const existing = await prisma.articleVote.findUnique({
    where: {
      articleId_userId: {
        articleId,
        userId: session.user.id,
      },
    },
  });

  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { score: true },
  });

  if (!article) {
    return NextResponse.json({ error: "Artículo no encontrado" }, { status: 404 });
  }

  let newScore = article.score;

  if (existing) {
    await prisma.$transaction([
      prisma.articleVote.delete({
        where: { id: existing.id },
      }),
      prisma.article.update({
        where: { id: articleId },
        data: { score: { decrement: existing.value } },
      }),
    ]);
    newScore -= existing.value;
  } else {
    await prisma.$transaction([
      prisma.articleVote.create({
        data: {
          articleId,
          userId: session.user.id,
          value: 1,
        },
      }),
      prisma.article.update({
        where: { id: articleId },
        data: { score: { increment: 1 } },
      }),
    ]);
    newScore += 1;
  }

  return NextResponse.json({ score: newScore });
}
