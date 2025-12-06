import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { isAdminRole, isModeratorRole } from "@/lib/moderation";

type ReviewPayload = {
  articleId?: string;
  action?: "flag" | "approve" | "reject";
};

export async function POST(request: Request) {
  const session = await requireUser();
  if (!isModeratorRole(session.user.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const payload: ReviewPayload = await request.json().catch(() => ({}));
  const { articleId, action } = payload;
  if (!articleId || !action) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) {
    return NextResponse.json({ error: "Artículo no encontrado" }, { status: 404 });
  }

  if (action === "flag") {
    await prisma.article.update({
      where: { id: articleId },
      data: { status: "REVIEW" },
    });
    return NextResponse.json({ success: true });
  }

  if (!isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
  }

  if (action === "approve") {
    await prisma.article.update({
      where: { id: articleId },
      data: { status: "PUBLISHED" },
    });
    return NextResponse.json({ success: true });
  }

  if (action === "reject") {
    await prisma.article.update({
      where: { id: articleId },
      data: { status: "REJECTED" },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
}
