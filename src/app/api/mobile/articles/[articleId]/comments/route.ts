import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractUserIdFromRequest } from "@/lib/mobile-token";
import { commentSchema } from "@/lib/validators";
import { recordCommentNotifications } from "@/lib/notifications";

type RouteContext = {
  params: Promise<{ articleId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const userId = await extractUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { articleId } = await context.params;
  const rawBody = await request.json().catch(() => null);
  const parsed = commentSchema.safeParse({ ...rawBody, articleId });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Comentario inválido", details: parsed.error.format() },
      { status: 400 },
    );
  }

  const article = await prisma.article.findUnique({
    where: { id: parsed.data.articleId },
    select: { id: true, authorId: true },
  });

  if (!article) {
    return NextResponse.json({ error: "Artículo no encontrado" }, { status: 404 });
  }

  let parentAuthorId: string | null = null;
  if (parsed.data.parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: parsed.data.parentId },
      select: { articleId: true, authorId: true },
    });

    if (!parent || parent.articleId !== parsed.data.articleId) {
      return NextResponse.json(
        { error: "No se puede responder a este comentario" },
        { status: 404 },
      );
    }
    parentAuthorId = parent.authorId;
  }

  const text = parsed.data.body.trim();
  if (!text) {
    return NextResponse.json({ error: "Tu comentario está vacío" }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      body: text,
      articleId: parsed.data.articleId,
      parentId: parsed.data.parentId ?? null,
      authorId: userId,
    },
    include: {
      author: { select: { username: true, image: true } },
      votes: { select: { value: true } },
    },
  });

  const actor = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });

  await recordCommentNotifications({
    articleId: article.id,
    articleAuthorId: article.authorId,
    parentAuthorId,
    commentId: comment.id,
    actorId: userId,
    actorName: actor?.username ?? "Usuario",
  });

  return NextResponse.json({ comment }, { status: 201 });
}
