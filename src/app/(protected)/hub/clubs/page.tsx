import { requireUser } from "@/lib/session";
import { getCurrentLocale, getDictionary, translate } from "@/lib/i18n/server";
import { LanguageSwitch } from "@/components/navigation/language-switch";
import { HubActionHud } from "@/components/navigation/hub-action-hud";
import { ClubPreviewCard } from "@/components/clubs/club-preview-card";
import { getClubsForViewer } from "@/lib/club-service";
import type { Role } from "@/types/roles";

type HubClubsPageProps = {
  searchParams?: Promise<{
    view?: string;
  }>;
};

export default async function HubClubsPage(props: HubClubsPageProps) {
  const [searchParams, session] = await Promise.all([
    props.searchParams ?? Promise.resolve(undefined),
    requireUser(),
  ]);
  const viewer = session.user;
  const [locale, clubs] = await Promise.all([getCurrentLocale(), getClubsForViewer(session.user.id)]);
  const dictionary = getDictionary(locale);
  const t = (path: string) => translate(dictionary, path);
  const activeTab = searchParams?.view === "mine" ? "mine" : "discover";
  const myClubs = clubs.filter((club) => club.viewerMembership);
  const visibleClubs = activeTab === "mine" ? myClubs : clubs;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 pt-10 pb-24 text-white">
      <header className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.35em] text-white/60">{t("hub.clubsHero.badge")}</p>
          <LanguageSwitch />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold leading-tight lg:text-5xl">{t("hub.clubsHero.title")}</h1>
          <p className="text-base text-white/80 lg:text-lg">{t("hub.clubsHero.subtitle")}</p>
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/60">
              {activeTab === "mine" ? t("hub.myClubs.badge") : t("hub.clubsList.badge")}
            </p>
            <h2 className="text-2xl font-semibold">
              {activeTab === "mine" ? t("hub.myClubs.title") : t("hub.clubsList.title")}
            </h2>
          </div>
        </div>
        {visibleClubs.length === 0 ? (
          <div className="rounded-4xl border border-white/10 bg-white/5 p-8 text-center text-white/80">
            <p className="text-lg font-semibold text-white">
              {activeTab === "mine" ? t("hub.myClubs.emptyTitle") : "No hay clubs disponibles por ahora."}
            </p>
            <p className="mt-2 text-sm">
              {activeTab === "mine" ? t("hub.myClubs.emptyDescription") : "Vuelve pronto para descubrir nuevos clubs."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {visibleClubs.map((club) => (
              <ClubPreviewCard
                key={club.slug}
                club={club}
                badgeLabel={activeTab === "mine" ? t("hub.myClubs.cardBadge") : t("hub.clubsList.cardBadge")}
              />
            ))}
          </div>
        )}
      </section>

      <HubActionHud
        username={viewer?.username ?? null}
        image={viewer?.image ?? null}
        sprite={viewer?.fabPixelSprite ?? null}
        role={(viewer?.role ?? "USER") as Role}
      />
    </main>
  );
}
