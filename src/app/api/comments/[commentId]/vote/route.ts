import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { recordCommentLikeNotification } from "@/lib/notifications";

interface CommentVoteParams {
  params: Promise<{ commentId: string }>;
}

export async function POST(_request: Request, context: CommentVoteParams) {
  const session = await requireUser();
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
        userId: session.user.id,
      },
    },
    select: { id: true, value: true },
  });

  if (existing) {
    await prisma.commentVote.delete({ where: { id: existing.id } });
    return NextResponse.json({ removed: true });
  }

  await prisma.commentVote.create({
    data: {
      commentId,
      userId: session.user.id,
      value: 1,
    },
  });

  await recordCommentLikeNotification({
    commentId,
    commentAuthorId: targetComment.authorId,
    articleId: targetComment.articleId,
    actorId: session.user.id,
    actorName: session.user.username,
  });

  return NextResponse.json({ liked: true });
}
