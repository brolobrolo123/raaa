import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractUserIdFromRequest } from "@/lib/mobile-token";
import { recordCommentLikeNotification } from "@/lib/notifications";

type RouteContext = {
  params: Promise<{ commentId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const userId = await extractUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { commentId } = await context.params;

  const targetComment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, authorId: true, articleId: true },
  });

  if (!targetComment) {
    return NextResponse.json({ error: "Comentario no encontrado" }, { status: 404 });
  }

  const existing = await prisma.commentVote.findUnique({
    where: {
      commentId_userId: {
        commentId,
        userId,
      },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.commentVote.delete({ where: { id: existing.id } });
    return NextResponse.json({ liked: false });
  }

  await prisma.commentVote.create({
    data: {
      commentId,
      userId,
      value: 1,
    },
  });

  const actor = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });

  await recordCommentLikeNotification({
    commentId,
    commentAuthorId: targetComment.authorId,
    articleId: targetComment.articleId,
    actorId: userId,
    actorName: actor?.username ?? "Usuario",
  });

  return NextResponse.json({ liked: true });
}
