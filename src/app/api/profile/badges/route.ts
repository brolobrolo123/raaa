import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserBadgeOverview, setFeaturedBadges } from "@/lib/badge-service";
import { prisma } from "@/lib/prisma";
import { MINI_PROFILE_ACCENTS, resolveMiniProfileAccent, type MiniProfileAccent } from "@/lib/mini-profile";
import { requireUser } from "@/lib/session";

const updateFeaturedSchema = z.object({
  featured: z.array(z.string().cuid()).max(4).optional(),
  accentColor: z.enum(MINI_PROFILE_ACCENTS).optional(),
});

export async function GET() {
  const session = await requireUser();
  const badges = await getUserBadgeOverview(session.user.id);
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { miniProfileAccent: true },
  });
  return NextResponse.json({ badges, accentColor: resolveMiniProfileAccent(user?.miniProfileAccent) });
}

export async function PUT(request: Request) {
  const session = await requireUser();
  const data = await request.json().catch(() => null);
  const parsed = updateFeaturedSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: "Selección inválida." }, { status: 400 });
  }
  const featured = parsed.data.featured ?? [];
  const accentUpdate = parsed.data.accentColor;
  const result = await prisma.$transaction(async (tx) => {
    const badges = await setFeaturedBadges(session.user.id, featured, tx);
    let accent: MiniProfileAccent;
    if (accentUpdate) {
      accent = accentUpdate;
      await tx.user.update({ where: { id: session.user.id }, data: { miniProfileAccent: accentUpdate } });
    } else {
      const current = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { miniProfileAccent: true },
      });
      accent = resolveMiniProfileAccent(current?.miniProfileAccent);
    }
    return { badges, accent };
  });
  return NextResponse.json({ badges: result.badges, accentColor: result.accent });
}
