import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getUserBadgeOverview, getUserContributionStats } from "@/lib/badge-service";
import { FullReloadLink } from "@/components/navigation/full-reload-link";
import { Card } from "@/components/ui/card";
import { PasswordForm } from "@/components/profile/password-form";
import { ProfileArticleList } from "@/components/profile/article-list";
import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { ProfileBadgeManager } from "@/components/profile/badge-manager";
import { ProfileSignOutButton } from "@/components/profile/profile-sign-out-button";
import { getCurrentLocale, getDictionary, translate } from "@/lib/i18n/server";
import { PROFILE_ARTICLES_PAGE_SIZE, type SerializedProfileArticle } from "@/lib/profile-articles";
import { BackgroundToggle } from "@/components/profile/background-toggle";

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
      fabPixelSprite: true,
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
        take: PROFILE_ARTICLES_PAGE_SIZE,
      },
    },
  });

  if (!profile) {
    notFound();
  }

  const joined = new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-US", {
    dateStyle: "long",
  }).format(profile.createdAt);
  const serializedArticles: SerializedProfileArticle[] = profile.articles.map((article) => ({
    ...article,
    createdAt: article.createdAt.toISOString(),
  }));
  const totalArticles = await prisma.article.count({
    where: { authorId: session.user.id },
  });
  const contributionStats = await getUserContributionStats(session.user.id);
  const badgeOverview = await getUserBadgeOverview(session.user.id);
  const localeCode = locale === "es" ? "es-ES" : "en-US";
  const numberFormatter = new Intl.NumberFormat(localeCode);
  const initialHasMore = totalArticles > serializedArticles.length;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-12 px-6 py-16 text-white">
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

      <section className="grid gap-6 sm:grid-cols-[minmax(0,1.7fr)_minmax(0,0.95fr)]">
        <Card className="border-white/10 bg-white/10 p-6">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{translate(dictionary, "profilePage.scoreLabel")}</p>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-4xl font-semibold text-white">{numberFormatter.format(contributionStats.articleCount)}</p>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{translate(dictionary, "profilePage.scoreArticlesLabel")}</p>
              </div>
              <div>
                <p className="text-4xl font-semibold text-white">{numberFormatter.format(contributionStats.articleVoteCount)}</p>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{translate(dictionary, "profilePage.scoreVotesLabel")}</p>
              </div>
              <div>
                <p className="text-4xl font-semibold text-white">{numberFormatter.format(contributionStats.points)}</p>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{translate(dictionary, "profilePage.scorePointsLabel")}</p>
              </div>
            </div>
          </div>
        </Card>
        <AvatarUploader initialAvatar={profile.image} username={profile.username} />
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
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
        <ProfileBadgeManager
          initialBadges={badgeOverview}
          initialAccent={profile.miniProfileAccent}
          viewAllLabel={translate(dictionary, "profilePage.viewAllBadgesButton")}
          collapseLabel={translate(dictionary, "profilePage.collapseBadgesButton")}
        />
      </section>

      <section>
        <Card className="border-white/10 bg-white/10 p-6">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{translate(dictionary, "profilePage.backgroundTitle")}</p>
            <h2 className="text-2xl font-semibold">{translate(dictionary, "profilePage.backgroundHeader")}</h2>
            <BackgroundToggle
              description={translate(dictionary, "profilePage.backgroundDescription")}
              enableLabel={translate(dictionary, "profilePage.backgroundEnableAction")}
              disableLabel={translate(dictionary, "profilePage.backgroundDisableAction")}
              enabledStatus={translate(dictionary, "profilePage.backgroundEnabledStatus")}
              disabledStatus={translate(dictionary, "profilePage.backgroundDisabledStatus")}
            />
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{translate(dictionary, "common.articles")}</p>
            <h2 className="text-2xl font-semibold">{translate(dictionary, "profilePage.recentArticlesTitle")}</h2>
          </div>
          <FullReloadLink href="/articles/new" className="text-sm font-semibold text-sky-300 hover:text-sky-200">
            {translate(dictionary, "profilePage.newArticleCta")}
          </FullReloadLink>
        </div>
        {profile.articles.length === 0 ? (
          <Card className="border-white/5 bg-white/5 p-6 text-center text-slate-300">
            {translate(dictionary, "profilePage.noArticles")}
          </Card>
        ) : (
          <ProfileArticleList
            articles={serializedArticles}
            initialHasMore={initialHasMore}
            viewMoreLabel={translate(dictionary, "profilePage.viewMoreArticles")}
          />
        )}
      </section>

      <ProfileSignOutButton />
    </main>
  );
}
