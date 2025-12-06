import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getCurrentLocale, getDictionary, translate } from "@/lib/i18n/server";
import { LanguageSwitch } from "@/components/navigation/language-switch";
import { HubActionHud } from "@/components/navigation/hub-action-hud";
import { ClubDetailShell } from "@/components/clubs/club-detail-shell";
import { getClubDetailForViewer } from "@/lib/club-service";
import { getProfilePointValue } from "@/lib/avatar/power";
import type { Role } from "@/types/roles";

interface ClubDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ClubDetailPage(props: ClubDetailPageProps) {
  const [{ slug }, session] = await Promise.all([props.params, requireUser()]);
  const viewer = session.user;
  const [detail, forumPoints] = await Promise.all([
    getClubDetailForViewer(slug, viewer.id, viewer.role as Role | undefined),
    getProfilePointValue(viewer.id),
  ]);
  if (!detail) {
    notFound();
  }
  const locale = await getCurrentLocale();
  const dictionary = getDictionary(locale);
  const t = (path: string) => translate(dictionary, path);

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 pt-8 pb-24 text-white">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-sm text-white/70">
          <Link href="/hub" className="underline-offset-4 hover:underline">
            {t("hub.clubsDetail.homeBreadcrumb")}
          </Link>
          <span aria-hidden>/</span>
          <Link href="/hub/clubs" className="underline-offset-4 hover:underline">
            {t("hub.clubsDetail.clubsBreadcrumb")}
          </Link>
          <span aria-hidden>/</span>
          <span className="font-semibold text-white">{detail.club.name}</span>
        </div>
        <LanguageSwitch />
      </header>

      <ClubDetailShell
        club={detail.club}
        memberCount={detail.memberCount}
        moderators={detail.moderators}
        messages={detail.messages}
        polls={detail.polls}
        viewer={{
          userId: viewer.id,
          username: viewer.username,
          image: viewer.image,
          points: forumPoints,
          ...detail.viewer,
        }}
      />

      <HubActionHud
        username={viewer.username}
        image={viewer.image}
        sprite={viewer.fabPixelSprite}
        role={(viewer.role ?? "USER") as Role}
      />
    </main>
  );
}
