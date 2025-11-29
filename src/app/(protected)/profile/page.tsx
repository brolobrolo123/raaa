import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getUserBadgeOverview } from "@/lib/badge-service";
import { HomeButton } from "@/components/navigation/home-button";
import { Card } from "@/components/ui/card";
import { PasswordForm } from "@/components/profile/password-form";
import { ProfileArticleList } from "@/components/profile/article-list";
import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { ProfileBadgeManager } from "@/components/profile/badge-manager";
import { getCurrentLocale, getDictionary, translate } from "@/lib/i18n/server";

export default async function ProfilePage() {
  const session = await requireUser();
  const locale = await getCurrentLocale();
  const dictionary = getDictionary(locale);
  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      username: true,
      email: true,
      image: true,
      miniProfileAccent: true,
      createdAt: true,
      articles: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          summary: true,
          createdAt: true,
          score: true,
          section: { select: { name: true, slug: true } },
        },
        take: 12,
      },
    },
  });

  if (!profile) {
    notFound();
  }

  const joined = new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-US", {
    dateStyle: "long",
  }).format(profile.createdAt);
  const serializedArticles = profile.articles.map((article) => ({
    ...article,
    createdAt: article.createdAt.toISOString(),
  }));
  const badgeOverview = await getUserBadgeOverview(session.user.id);
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-12 px-6 py-16 text-white">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-300">{translate(dictionary, "common.profile")}</p>
          <h1 className="text-4xl font-semibold">{translate(dictionary, "common.personalPanel")}</h1>
          <p className="text-slate-300">
            {profile.username} · {profile.email}
          </p>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            {translate(dictionary, "common.memberSince")} {joined}
          </p>
        </div>
        <HomeButton expanded />
      </div>

      <section className="grid gap-6">
        <AvatarUploader initialAvatar={profile.image} username={profile.username} />
        <ProfileBadgeManager initialBadges={badgeOverview} initialAccent={profile.miniProfileAccent} />
        <Card className="border-white/10 bg-white/10 p-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{translate(dictionary, "profilePage.securityLabel")}</p>
              <h2 className="text-2xl font-semibold">{translate(dictionary, "profilePage.securityTitle")}</h2>
              <p className="text-sm text-slate-300">{translate(dictionary, "profilePage.securityDescription")}</p>
            </div>
            <PasswordForm />
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{translate(dictionary, "common.articles")}</p>
            <h2 className="text-2xl font-semibold">{translate(dictionary, "profilePage.recentArticlesTitle")}</h2>
          </div>
          <Link href="/articles/new" className="text-sm font-semibold text-sky-300 hover:text-sky-200">
            {translate(dictionary, "profilePage.newArticleCta")}
          </Link>
        </div>
        {profile.articles.length === 0 ? (
          <Card className="border-white/5 bg-white/5 p-6 text-center text-slate-300">
            {translate(dictionary, "profilePage.noArticles")}
          </Card>
        ) : (
          <ProfileArticleList articles={serializedArticles} />
        )}
      </section>
    </main>
  );
}
