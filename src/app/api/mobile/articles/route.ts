import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { articleSchema } from "@/lib/validators";
import { sanitizeHtml } from "@/lib/sanitizer";
import { SECTION_DEFINITIONS, type SectionSlug } from "@/lib/sections";
import { extractUserIdFromRequest } from "@/lib/mobile-token";

export async function POST(request: Request) {
  const userId = await extractUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const raw = await request.json().catch(() => null);
  const parsed = articleSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Contenido inválido", details: parsed.error.format() },
      { status: 400 },
    );
  }

  const slug = parsed.data.section as SectionSlug;
  if (!SECTION_DEFINITIONS[slug]) {
    return NextResponse.json({ error: "Sección no encontrada" }, { status: 404 });
  }

  const section = await prisma.section.findFirst({
    where: { slug },
    select: { id: true },
  });

  if (!section) {
    return NextResponse.json({ error: "Sección no encontrada" }, { status: 404 });
  }

  const authoredCount = await prisma.article.count({ where: { authorId: userId } });
  if (authoredCount >= 100) {
    return NextResponse.json({ error: "Has alcanzado el límite de 100 artículos." }, { status: 403 });
  }

  const sanitizedContent = sanitizeHtml(parsed.data.content);

  const article = await prisma.article.create({
    data: {
      title: parsed.data.title,
      summary: parsed.data.summary,
      content: sanitizedContent,
      sectionId: section.id,
      authorId: userId,
      coverColor: parsed.data.coverColor ?? null,
    },
    select: { id: true },
  });

  return NextResponse.json({ id: article.id }, { status: 201 });
}
