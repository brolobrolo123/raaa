import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/article/article-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FullReloadLink } from "@/components/navigation/full-reload-link";
import { cn } from "@/lib/cn";
import { getSectionSnapshot } from "@/lib/article-service";
import { getCoverBackgroundStyles, getCoverBorderColor } from "@/lib/media";
import {
  SECTION_SLUGS,
  getSectionCopy,
  getSectionParentSlug,
  getSectionTopics,
  isPrimarySectionSlug,
  type SectionSlug,
} from "@/lib/sections";
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
  const view = viewInput === "recent" ? "recent" : "top";

  const snapshot = await getSectionSnapshot({ slug: typedSlug, page, view });
  const locale = await getCurrentLocale();
  const dictionary = getDictionary(locale);
  const t = (path: string) => translate(dictionary, path);
  const sectionCopy = getSectionCopy(typedSlug, locale);
  const sectionName = sectionCopy.name ?? snapshot.section.name ?? typedSlug;
  const sectionDescription = sectionCopy.description ?? snapshot.section.description ?? "";
  const isPrimarySection = isPrimarySectionSlug(typedSlug);
  const primarySlugContext = isPrimarySection ? typedSlug : getSectionParentSlug(typedSlug);
  const topicSlugs = primarySlugContext ? getSectionTopics(primarySlugContext) : [];
  const showTopicSelector = Boolean(primarySlugContext && topicSlugs.length > 0);
  const allTopicsLabel = t("sectionsPage.topicSelectorAll");
  const topArticles = snapshot.topArticles;
  const recentArticles = snapshot.recentArticles;
  const currentView = snapshot.view;
  const currentPage = snapshot.page;
  const hasMoreTop = snapshot.hasMoreTop;
  const hasMoreRecent = snapshot.hasMoreRecent;

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-16 text-white">
      <header className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold">{sectionName}</h1>
          <p className="text-slate-300">{sectionDescription}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/5 px-4 py-2">
            <span className="text-xs uppercase tracking-[0.3em] text-white/50">{t("common.filter")}</span>
            <div className="flex items-center gap-2">
              <FullReloadLink
                href={`/sections/${typedSlug}?view=top`}
                className={cn(
                  "rounded-2xl px-3 py-1 text-sm text-white/70 transition hover:bg-white/10 hover:text-white",
                  currentView === "top" && "bg-white/10 text-white",
                )}
              >
                {t("common.mostVoted")}
              </FullReloadLink>
              <FullReloadLink
                href={`/sections/${typedSlug}?view=recent`}
                className={cn(
                  "rounded-2xl px-3 py-1 text-sm text-white/70 transition hover:bg-white/10 hover:text-white",
                  currentView === "recent" && "bg-white/10 text-white",
                )}
              >
                {t("common.recent")}
              </FullReloadLink>
            </div>
          </div>
        </div>
      </header>

      {showTopicSelector && (
        <section className="space-y-2 rounded-3xl border border-white/10 bg-white/5 p-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/50">{t("sectionsPage.topicSelectorLabel")}</p>
            <p className="text-sm text-white/70">{t("sectionsPage.topicSelectorHint")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {primarySlugContext && (
              <FullReloadLink
                key={primarySlugContext}
                href={`/sections/${primarySlugContext}`}
                className={cn(
                  "rounded-2xl px-3 py-1 text-sm font-semibold transition",
                  typedSlug === primarySlugContext
                    ? "bg-white/20 text-white"
                    : "border border-white/10 text-white/70 hover:border-white/30",
                )}
              >
                {allTopicsLabel}
              </FullReloadLink>
            )}
            {topicSlugs.map((subSlug) => {
              const subCopy = getSectionCopy(subSlug, locale);
              const isActive = typedSlug === subSlug;
              return (
                <FullReloadLink
                  key={subSlug}
                  href={`/sections/${subSlug}`}
                  className={cn(
                    "rounded-2xl px-3 py-1 text-sm font-semibold transition",
                    isActive
                      ? "bg-white/20 text-white"
                      : "border border-white/10 text-white/70 hover:border-white/30",
                  )}
                >
                  {subCopy.name}
                </FullReloadLink>
              );
            })}
          </div>
        </section>
      )}

      {currentView === "top" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">{t("common.mostVoted")}</h2>
            <span className="text-sm text-slate-400">
              {topArticles.length} {t("sectionsPage.watchCountSuffix")}
            </span>
          </div>
          {topArticles.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {topArticles.map((article) => (
                <ArticleCard key={article.id} article={{ ...article, createdAt: article.createdAt }} highlight />
              ))}
            </div>
          ) : (
            <Card className="border-white/5 bg-white/10 text-center text-slate-300">
              {t("sectionsPage.noRecentRecords")}
            </Card>
          )}
          {isPrimarySection && (currentPage > 1 || hasMoreTop) && (
            <div className="flex items-center gap-4">
              {currentPage > 1 && (
                <Button asChild variant="secondary">
                  <FullReloadLink href={`/sections/${typedSlug}?view=top&page=${Math.max(1, currentPage - 1)}`}>
                    ← {t("common.previousPage")}
                  </FullReloadLink>
                </Button>
              )}
              {hasMoreTop && (
                <Button asChild variant="secondary">
                  <FullReloadLink href={`/sections/${typedSlug}?view=top&page=${currentPage + 1}`}>
                    {t("common.nextPage")} →
                  </FullReloadLink>
                </Button>
              )}
            </div>
          )}
        </section>
      )}

      {currentView === "recent" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">{t("common.recent")}</h2>
            <span className="text-sm text-slate-400">
              {t("common.page")} {currentPage} {hasMoreRecent ? t("sectionsPage.moreAvailable") : ""}
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {recentArticles.map((article) => (
              <FullReloadLink
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
              </FullReloadLink>
            ))}
            {recentArticles.length === 0 && (
              <Card className="border-white/5 bg-white/10 text-center text-slate-300">
                {t("sectionsPage.noRecentRecords")}
              </Card>
            )}
          </div>
          {isPrimarySection && (currentPage > 1 || hasMoreRecent) && (
            <div className="flex items-center gap-4">
              {currentPage > 1 && (
                <Button asChild variant="secondary">
                  <FullReloadLink href={`/sections/${typedSlug}?view=recent&page=${Math.max(1, currentPage - 1)}`}>
                    ← {t("common.previousPage")}
                  </FullReloadLink>
                </Button>
              )}
              {hasMoreRecent && (
                <Button asChild variant="secondary">
                  <FullReloadLink href={`/sections/${typedSlug}?view=recent&page=${currentPage + 1}`}>
                    {t("common.nextPage")} →
                  </FullReloadLink>
                </Button>
              )}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
