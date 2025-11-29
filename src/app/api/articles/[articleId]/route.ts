import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ articleId: string }>;
};

export async function DELETE(_: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { articleId } = await context.params;
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { authorId: true },
  });

  if (!article) {
    return NextResponse.json({ error: "Artículo no encontrado" }, { status: 404 });
  }

  if (article.authorId !== session.user.id) {
    return NextResponse.json({ error: "No puedes eliminar este artículo" }, { status: 403 });
  }

  await prisma.article.delete({ where: { id: articleId } });
  return NextResponse.json({ message: "Artículo eliminado" });
}
