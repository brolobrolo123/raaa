import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { AccountMenu } from "@/components/navigation/account-menu";
import { NotificationBell } from "@/components/navigation/notification-bell";
import { SECTION_DEFINITIONS, getSectionCopy, type SectionSlug } from "@/lib/sections";
import { cn } from "@/lib/cn";
import { getCurrentLocale, getDictionary, translate } from "@/lib/i18n/server";

interface HubPageProps {
  searchParams: Promise<{ focus?: string }>;
}

export default async function HubPage(props: HubPageProps) {
  const session = await requireUser();
  const currentUser = session?.user;
  const searchParams = await props.searchParams;
  const baseSections = await prisma.section.findMany({
    orderBy: { id: "asc" },
  });

  const articleHighlightSelect = {
    id: true,
    title: true,
    summary: true,
    score: true,
    createdAt: true,
    author: { select: { username: true } },
  } as const;

  const sections = await Promise.all(
    baseSections.map(async (section) => {
      const [topArticles, recentArticles] = await Promise.all([
        prisma.article.findMany({
          where: { sectionId: section.id },
          orderBy: [{ score: "desc" }, { createdAt: "desc" }],
          take: 4,
          select: articleHighlightSelect,
        }),
        prisma.article.findMany({
          where: { sectionId: section.id },
          orderBy: { createdAt: "desc" },
          take: 2,
          select: articleHighlightSelect,
        }),
      ]);
      return { ...section, topArticles, recentArticles };
    }),
  );

  const focus = searchParams?.focus;
  const locale = await getCurrentLocale();
  const dictionary = getDictionary(locale);
  const t = (path: string) => translate(dictionary, path);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-16 text-white">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-semibold">{t("hub.title")}</h1>
          <p className="text-slate-300">{t("hub.description")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <NotificationBell />
          <Button
            asChild
            className="bg-linear-to-r from-sky-500 via-indigo-500 to-purple-500 text-white shadow-[0_10px_30px_rgba(14,165,233,0.35)] hover:-translate-y-px"
          >
            <Link href="/articles/new">{t("common.createArticle")}</Link>
          </Button>
          <AccountMenu
            avatarUrl={currentUser?.image}
            username={currentUser?.username ?? currentUser?.name ?? currentUser?.email ?? undefined}
          />
        </div>
      </header>

      <section className="mt-4 flex flex-col gap-6 pb-16">
        <p className="text-xs uppercase tracking-[0.35em] text-white/50">{t("hub.exploreLabel")}</p>
        <div className="grid grid-cols-1 gap-6 pb-8 lg:grid-cols-3">
          {sections.map((section) => {
            const typedSlug = section.slug as SectionSlug;
            const definition = SECTION_DEFINITIONS[typedSlug];
            const accent = definition?.accentColor ?? "#2563eb";
            const icon = definition?.icon ?? "📚";
            const isFocused = focus === section.slug;
            const copy = getSectionCopy(typedSlug, locale);
            const topArticles = section.topArticles.slice(0, 4);
            const paddedTopArticles = topArticles.concat(Array(Math.max(0, 4 - topArticles.length)).fill(null));
            return (
              <Link
                key={section.id}
                href={`/sections/${section.slug}`}
                prefetch={false}
                className="group relative block w-full focus:outline-none"
                style={{ perspective: "1800px" }}
              >
                <div
                  className="relative h-full min-h-[420px] w-full transition duration-700 transform-3d group-hover:transform-[rotateY(180deg)] focus-within:transform-[rotateY(180deg)]"
                >
                  <div
                    className={cn(
                      "absolute inset-0 flex flex-col rounded-4xl border border-white/10 bg-linear-to-br from-slate-900/80 via-slate-950/70 to-black/70 p-6 text-white shadow-[0_15px_40px_rgba(15,23,42,0.45)]",
                      isFocused && "border-white/60",
                    )}
                    style={{
                      backfaceVisibility: "hidden",
                      background: `linear-gradient(140deg, ${accent}33, rgba(3,7,18,0.95))`,
                      boxShadow: isFocused
                        ? "0 25px 55px rgba(34,197,255,0.25), inset 0 0 0 2px rgba(255,255,255,0.35)"
                        : undefined,
                    }}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3 text-white/80">
                        <span className="text-3xl" aria-hidden>
                          {icon}
                        </span>
                        <div>
                          <span className="text-xs uppercase tracking-[0.3em] text-white/60">{t("common.sectionLabel")}</span>
                          <h2 className="text-2xl font-semibold leading-snug">{copy.name ?? section.name}</h2>
                        </div>
                      </div>
                      <p className="text-sm text-white/80">{copy.description ?? section.description}</p>
                      {copy?.example && (
                        <p className="text-xs italic text-white/75">“{copy.example}”</p>
                      )}
                    </div>
                    <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-[11px] uppercase tracking-[0.35em] text-white/60">{t("common.featuredArticle")}</p>
                      {section.topArticles[0] ? (
                        <div className="mt-2 flex flex-col gap-2 text-left">
                          <h3 className="text-lg font-semibold text-white">{section.topArticles[0].title}</h3>
                          <p className="text-sm text-white/80 line-clamp-3">{section.topArticles[0].summary}</p>
                          <div className="flex items-center justify-between text-xs text-white/60">
                            <span>@{section.topArticles[0].author.username}</span>
                            <span>⬆ {section.topArticles[0].score}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-white/60">{t("common.noVotesYet")}</p>
                      )}
                    </div>
                  </div>

                  <div
                    className="absolute inset-0 flex flex-col rounded-4xl border border-white/10 bg-slate-950/95 p-5 text-white shadow-2xl"
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}
                  >
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.3em] text-white/50">{t("hub.topLabel")}</p>
                      <ul className="mt-3 space-y-2 text-sm">
                        {paddedTopArticles.map((article, index) => (
                          <li key={article?.id ?? `empty-${index}`} className="flex flex-col gap-2 rounded-2xl border border-white/5 bg-white/5 px-3 py-2">
                            {article ? (
                              <>
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-white">{article.title}</p>
                                    <p className="text-xs text-white/60">@{article.author.username}</p>
                                  </div>
                                  <span className="text-xs font-semibold text-sky-300">⬆ {article.score}</span>
                                </div>
                                <p className="text-xs text-white/70 line-clamp-2">{article.summary}</p>
                              </>
                            ) : (
                              <p className="text-xs text-white/50">{t("hub.emptyTopSlot")}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
