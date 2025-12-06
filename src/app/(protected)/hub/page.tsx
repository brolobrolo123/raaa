import Image from "next/image";
import { requireUser } from "@/lib/session";
import { FullReloadLink } from "@/components/navigation/full-reload-link";
import { LanguageSwitch } from "@/components/navigation/language-switch";
import { UserAvatar } from "@/components/user/user-avatar";
import { PRIMARY_SECTION_SLUGS, SECTION_DEFINITIONS, getSectionCopy, type SectionSlug } from "@/lib/sections";
import { cn } from "@/lib/cn";
import { getCurrentLocale, getDictionary, translate } from "@/lib/i18n/server";
import { HubActionHud } from "@/components/navigation/hub-action-hud";
import { getSectionSnapshot } from "@/lib/article-service";
import type { Role } from "@/types/roles";

interface HubPageProps {
  searchParams: Promise<{ focus?: string }>;
}

export default async function HubPage(props: HubPageProps) {
  const session = await requireUser();
  const viewer = session.user;
  const searchParams = await props.searchParams;

  const focus = searchParams?.focus;
  const locale = await getCurrentLocale();
  const dictionary = getDictionary(locale);
  const t = (path: string) => translate(dictionary, path);

  type SnapshotArticle = Awaited<ReturnType<typeof getSectionSnapshot>>["topArticles"][number];
  type TrendingEntry = {
    sectionSlug: SectionSlug;
    sectionName: string;
    article: SnapshotArticle;
  };

  const sections = await Promise.all(
    PRIMARY_SECTION_SLUGS.map(async (slug) => {
      const snapshot = await getSectionSnapshot({ slug, view: "top" });
      const definition = SECTION_DEFINITIONS[slug];
      return {
        id: slug,
        slug,
        name: definition.name[locale],
        description: definition.description[locale],
        topArticles: snapshot.topArticles,
      };
    }),
  );

  const trendingEntries: TrendingEntry[] = sections.flatMap((section) => {
    const topArticle = section.topArticles[0];
    if (!topArticle) {
      return [];
    }
    const sectionName = SECTION_DEFINITIONS[section.slug as SectionSlug].name[locale];
    return [
      {
        sectionSlug: section.slug as SectionSlug,
        sectionName,
        article: topArticle,
      } satisfies TrendingEntry,
    ];
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 pt-10 pb-12 text-white">
      <header className="-mt-2 flex flex-col gap-4 sm:-mt-3">
        <div className="flex justify-end">
          <LanguageSwitch />
        </div>
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-4xl font-semibold leading-tight">{t("hub.heroHeadline")}</h1>
          <Image
            src="/logos/logo1.png"
            alt="Logo principal"
            width={1540}
            height={1540}
            priority
            className="h-32 w-32 object-contain sm:h-300 sm:w-39 lg:h-50 lg:w-70"
          />
        </div>
        <div>
          <FullReloadLink
            href="/hub#secciones"
            className="inline-flex items-center gap-2 rounded-3xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:border-white/40 hover:bg-white/20"
          >
            {t("hub.exploreSectionsButton")}
            <span aria-hidden>→</span>
          </FullReloadLink>
        </div>
      </header>

      <section className="mt-4 flex flex-col gap-6 pb-16">
        <div className="space-y-6">
          <div className="rounded-4xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-col gap-1">
              <p className="text-[11px] uppercase tracking-[0.35em] text-white/60">{t("hub.trendingLabel")}</p>
              {/* Description intentionally removed */}
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {trendingEntries.length === 0 ? (
                <p className="text-sm text-white/50">{t("hub.trendingEmpty")}</p>
              ) : (
                trendingEntries.map(({ sectionSlug, sectionName, article }) => (
                  <FullReloadLink
                    key={`${sectionSlug}-${article.id}`}
                    href={`/articles/${article.id}?section=${sectionSlug}`}
                    className="flex flex-col gap-3 rounded-3xl border border-white/5 bg-slate-950/90 p-4 transition hover:border-white/30"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] uppercase tracking-[0.3em] text-white/50">{sectionName}</span>
                        <h3 className="text-lg font-semibold leading-tight text-white">{article.title}</h3>
                      </div>
                      <span className="text-xs font-semibold text-sky-300">⬆ {article.score}</span>
                    </div>
                    <p className="text-sm text-white/70 line-clamp-2">{article.summary}</p>
                    <div className="flex items-start gap-3">
                      <UserAvatar
                        image={article.author.image ?? undefined}
                        size={40}
                        alt={`Avatar de ${article.author.username}`}
                      />
                      <div className="flex flex-col gap-1 text-left text-sm text-white/70">
                        <span className="text-sm font-semibold text-white">@{article.author.username}</span>
                        {article.topComment ? (
                          <p className="text-xs text-white/60 line-clamp-2">
                            <span className="font-semibold text-white">{t("hub.lastCommentLabel")}:</span>{" "}
                            {article.topComment.body}
                          </p>
                        ) : (
                          <p className="text-xs text-white/50">{t("sectionsPage.noComments")}</p>
                        )}
                      </div>
                    </div>
                  </FullReloadLink>
                ))
              )}
            </div>
          </div>
        </div>
        <div id="secciones" className="grid grid-cols-1 gap-6 pb-8 lg:grid-cols-3">
          {sections.map((section) => {
            const typedSlug = section.slug as SectionSlug;
            const definition = SECTION_DEFINITIONS[typedSlug];
            const accent = definition?.accentColor ?? "#2563eb";
            const isFocused = focus === section.slug;
            const copy = getSectionCopy(typedSlug, locale);
            const iconImage = copy.iconImage;
            const topArticles = section.topArticles.slice(0, 4);
            const paddedTopArticles = topArticles.concat(Array(Math.max(0, 4 - topArticles.length)).fill(null));
            return (
              <FullReloadLink
                key={section.id}
                href={`/sections/${section.slug}`}
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
                        {iconImage ? (
                          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10" aria-hidden>
                            <Image src={iconImage} alt="" width={48} height={48} className="h-10 w-10 object-contain" />
                          </span>
                        ) : (
                          <span className="text-3xl" aria-hidden>
                            📚
                          </span>
                        )}
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
              </FullReloadLink>
            );
          })}
        </div>
        <div>
          <HubActionHud
            username={viewer?.username ?? null}
            image={viewer?.image ?? null}
            sprite={viewer?.fabPixelSprite ?? null}
            role={(viewer?.role ?? "USER") as Role}
          />
        </div>
      </section>
    </main>
  );
}
