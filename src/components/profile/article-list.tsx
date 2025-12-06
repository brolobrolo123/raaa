"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FullReloadLink } from "@/components/navigation/full-reload-link";
import { useLocale, useTranslations } from "@/lib/i18n/client";
import { SECTION_DEFINITIONS } from "@/lib/sections";
import type { SerializedProfileArticle } from "@/lib/profile-articles";

interface ProfileArticleListProps {
  articles: SerializedProfileArticle[];
  viewMoreLabel: string;
  initialHasMore: boolean;
}

export function ProfileArticleList({ articles, viewMoreLabel, initialHasMore }: ProfileArticleListProps) {
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [articleList, setArticleList] = useState(articles);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-US", { dateStyle: "medium" }),
    [locale],
  );

  const localeKey = locale === "es" ? "es" : "en";

  const getSectionLabel = (slug: string, fallback: string) => {
    const definition = SECTION_DEFINITIONS[slug as keyof typeof SECTION_DEFINITIONS];
    if (!definition) return fallback;
    return definition.name[localeKey] ?? fallback;
  };

  const handleDelete = async (articleId: string) => {
    if (!confirm(t("profilePage.articleList.deleteConfirm"))) return;
    setDeletingId(articleId);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/articles/${articleId}`, { method: "DELETE" });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setErrorMessage(typeof data?.error === "string" ? data.error : t("profilePage.articleList.deleteError"));
        return;
      }
      router.refresh();
    } catch {
      setErrorMessage(t("profilePage.articleList.unexpectedDeleteError"));
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    setArticleList(articles);
    setCurrentPage(0);
    setHasMore(initialHasMore);
  }, [articles, initialHasMore]);

  const handleLoadMore = async () => {
    if (!hasMore || isLoadingMore) return;
    setErrorMessage(null);
    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const response = await fetch(`/api/profile/articles?page=${nextPage}`, { cache: "no-store" });
      const payload = (await response.json()) as {
        articles?: SerializedProfileArticle[];
        hasMore?: boolean;
        error?: string;
      };
      if (!response.ok || !payload.articles) {
        throw new Error(payload.error ?? t("profilePage.articleList.loadMoreError"));
      }
      setArticleList((prev) => [...prev, ...payload.articles!]);
      setCurrentPage(nextPage);
      setHasMore(Boolean(payload.hasMore));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("profilePage.articleList.unexpectedLoadError"));
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="space-y-4">
      {errorMessage && <p className="text-sm text-rose-300">{errorMessage}</p>}
      <ul className="space-y-4">
        {articleList.map((article) => (
          <li key={article.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/60">
              <span>{getSectionLabel(article.section.slug, article.section.name)}</span>
              <span>{dateFormatter.format(new Date(article.createdAt))}</span>
            </div>
            <FullReloadLink
              href={`/articles/${article.id}`}
              className="mt-3 block text-lg font-semibold text-white transition hover:text-sky-200"
            >
              {article.title}
            </FullReloadLink>
            <p className="mt-2 text-sm text-slate-200">{article.summary}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span>
                {t("profilePage.articleList.votes")}: {article.score}
              </span>
              <FullReloadLink href={`/sections/${article.section.slug}`} className="text-sky-300 hover:text-sky-200">
                {t("profilePage.articleList.viewSection")}
              </FullReloadLink>
              <Button
                type="button"
                variant="ghost"
                className="ml-auto border border-transparent text-rose-300 hover:border-rose-200/30 hover:bg-white/5 hover:text-rose-200"
                onClick={() => handleDelete(article.id)}
                disabled={deletingId === article.id}
              >
                {deletingId === article.id ? t("profilePage.articleList.deleting") : t("profilePage.articleList.delete")}
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {hasMore && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={handleLoadMore}
            className="text-sm uppercase tracking-[0.3em]"
            disabled={isLoadingMore}
            loading={isLoadingMore}
          >
            {isLoadingMore ? t("common.loading") : viewMoreLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
