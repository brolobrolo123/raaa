import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/article/article-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HomeButton } from "@/components/navigation/home-button";
import { NotificationBell } from "@/components/navigation/notification-bell";
import { cn } from "@/lib/cn";
import { getSectionSnapshot } from "@/lib/article-service";
import { getCoverBackgroundStyles, getCoverBorderColor } from "@/lib/media";
import { getSectionCopy, SECTION_SLUGS, type SectionSlug } from "@/lib/sections";
import { requireUser } from "@/lib/session";
import { getCurrentLocale, getDictionary, translate } from "@/lib/i18n/server";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; view?: string }>;
}

export default async function SectionPage(props: PageProps) {
  await requireUser();
  const [{ slug }, searchParams] = await Promise.all([props.params, props.searchParams]);
  const typedSlug = slug as SectionSlug;

  if (!SECTION_SLUGS.includes(typedSlug)) {
    notFound();
  }

  const page = Number(searchParams.page ?? "1");
  const viewInput = searchParams.view;
  const view = viewInput === "top" || viewInput === "recent" ? viewInput : "default";

  const snapshot = await getSectionSnapshot({ slug: typedSlug, page, view });
  if (!snapshot) {
    notFound();
  }
  const locale = await getCurrentLocale();
  const dictionary = getDictionary(locale);
  const t = (path: string) => translate(dictionary, path);
  const sectionCopy = getSectionCopy(typedSlug, locale);
  const sectionName = sectionCopy.name ?? snapshot.section.name;
  const sectionDescription = sectionCopy.description ?? snapshot.section.description;

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-16 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <HomeButton expanded />
        <NotificationBell />
      </div>

      <header className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold">{sectionName}</h1>
          <p className="text-slate-300">{sectionDescription}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/5 px-4 py-2">
            <span className="text-xs uppercase tracking-[0.3em] text-white/50">{t("common.filter")}</span>
            <div className="flex items-center gap-2">
              <Link
                href={`/sections/${typedSlug}?view=top`}
                className={cn(
                  "rounded-2xl px-3 py-1 text-sm text-white/70 transition hover:bg-white/10 hover:text-white",
                  view === "top" && "bg-white/10 text-white",
                )}
              >
                {t("common.mostVoted")}
              </Link>
              <Link
                href={`/sections/${typedSlug}?view=recent`}
                className={cn(
                  "rounded-2xl px-3 py-1 text-sm text-white/70 transition hover:bg-white/10 hover:text-white",
                  view === "recent" && "bg-white/10 text-white",
                )}
              >
                {t("common.recent")}
              </Link>
            </div>
          </div>
          <Button
            asChild
            className="bg-linear-to-r from-sky-500 via-indigo-500 to-purple-500 text-white shadow-[0_10px_30px_rgba(14,165,233,0.35)] hover:-translate-y-px"
          >
            <Link href="/articles/new">{t("common.publishArticle")}</Link>
          </Button>
        </div>
      </header>

      {snapshot.topArticles.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">{t("common.mostVoted")}</h2>
            <span className="text-sm text-slate-400">
              {snapshot.topArticles.length} {t("sectionsPage.watchCountSuffix")}
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {snapshot.topArticles.map((article) => (
              <ArticleCard key={article.id} article={{ ...article, createdAt: article.createdAt }} highlight />
            ))}
          </div>
        </section>
      )}

      {snapshot.view !== "top" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">{t("common.recent")}</h2>
            <span className="text-sm text-slate-400">
              {t("common.page")} {snapshot.page} {snapshot.hasMoreRecent ? t("sectionsPage.moreAvailable") : ""}
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {snapshot.recentArticles.map((article) => (
              <Link
                key={article.id}
                href={`/articles/${article.id}`}
                className="rounded-3xl border bg-cover bg-center p-5 text-white shadow-inner transition hover:-translate-y-1"
                style={{
                  ...getCoverBackgroundStyles(article.coverImage, article.coverColor),
                  borderColor: getCoverBorderColor(article.coverImage, article.coverColor),
                }}
              >
                <div className="flex flex-wrap items-center justify-between text-xs uppercase tracking-[0.2em] text-white/60">
                  <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                  <span className="flex items-center gap-3 text-[11px]">
                    <span className="inline-flex items-center gap-1">⬆ {article.score}</span>
                    <span className="inline-flex items-center gap-1">💬 {article._count.comments}</span>
                  </span>
                </div>
                <h3 className="mt-3 text-2xl font-semibold">{article.title}</h3>
                <p className="mt-2 text-sm text-slate-200">{article.summary}</p>
                {article.topComment ? (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-white/90">
                    <p
                      className="text-sm"
                      style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                    >
                      &quot;{article.topComment.body}&quot;
                    </p>
                    <p className="mt-2 text-xs text-slate-300">
                        — @{article.topComment.author.username} · {article.topComment.score} {t("common.votes")}
                    </p>
                  </div>
                ) : (
                    <p className="mt-4 text-xs text-slate-400">{t("sectionsPage.noComments")}</p>
                )}
              </Link>
            ))}
            {snapshot.recentArticles.length === 0 && (
                <Card className="border-white/5 bg-white/10 text-center text-slate-300">
                  {t("sectionsPage.noRecentRecords")}
                </Card>
            )}
          </div>
          <div className="flex items-center gap-4">
            {snapshot.page > 1 && (
              <Button asChild variant="secondary">
                <Link href={`/sections/${typedSlug}?view=${view}&page=${Math.max(1, snapshot.page - 1)}`}>
                  ← {t("common.previousPage")}
                </Link>
              </Button>
            )}
            {snapshot.hasMoreRecent && (
              <Button asChild variant="secondary">
                <Link href={`/sections/${typedSlug}?view=${view}&page=${snapshot.page + 1}`}>
                  {t("common.nextPage")} →
                </Link>
              </Button>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
