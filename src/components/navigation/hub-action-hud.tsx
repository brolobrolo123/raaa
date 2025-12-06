"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Home, MessageCircle, ScrollText, Shield, Users, type LucideIcon } from "lucide-react";
import { useMemo, type AnchorHTMLAttributes, type ReactNode } from "react";
import { NotificationBellButton } from "@/components/navigation/notification-bell";
import { UserAvatar } from "@/components/user/user-avatar";
import { HEAD_CANVAS, parsePixelSprite } from "@/lib/pixel-avatar";
import { useTranslations } from "@/lib/i18n/client";
import { SECTION_SLUGS, type SectionSlug } from "@/lib/sections";
import type { Role } from "@/types/roles";
import type { AvatarTab } from "@/components/avatar/avatar-client";

const HUD_IMAGE_PATHS = {
  homeHub: "/hud-icons/home-hub.png",
  homeAvatar: "/hud-icons/home-avatar.png",
  publish: "/hud-icons/publish.png",
  clubs: "/hud-icons/clubs.png",
  notifications: "/hud-icons/notifications.png",
  battle: "/hud-icons/battle.png",
  market: "/hud-icons/market.png",
  ranking: "/hud-icons/ranking.png",
} as const;

type HudImageKey = keyof typeof HUD_IMAGE_PATHS;

type TranslateFn = (path: string) => string;

interface HubActionHudProps {
  username?: string | null;
  image?: string | null;
  role?: Role;
  sprite?: string | null;
}

export function HubActionHud({ username, image, role, sprite }: HubActionHudProps) {
  const t = useTranslations();
  const avatarAlt = username
    ? t("accountMenu.avatarAltNamed").replace("{name}", username)
    : t("accountMenu.avatarAlt");
  const canViewPanel = role && role !== "USER";
  const canAccessOwnerTabs = role === "OWNER";
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAvatarView = pathname?.startsWith("/avatar") ?? false;
  const currentAvatarTab = (searchParams?.get("tab") ?? "battle") as AvatarTab;
  const isHubHome = pathname === "/hub" || pathname === "/hub/";
  const isClubsView = pathname?.startsWith("/hub/clubs") ?? false;
  const isClubsHome = pathname === "/hub/clubs" || pathname === "/hub/clubs/";
  const clubSlug = !isClubsHome && pathname?.startsWith("/hub/clubs/") ? pathname.split("/")[3] ?? null : null;
  const clubsListView: "discover" | "mine" = searchParams?.get("view") === "mine" ? "mine" : "discover";
  const clubsDetailView: "chat" | "rules" = searchParams?.get("view") === "rules" ? "rules" : "chat";
  const sectionPathSlug = pathname?.startsWith("/sections/") ? pathname.split("/")[2] ?? null : null;
  const sectionFromQuery = searchParams?.get("section") ?? null;
  const resolvedSectionSlug = sectionPathSlug ?? sectionFromQuery;
  const normalizedSectionContext = resolvedSectionSlug && SECTION_SLUGS.includes(resolvedSectionSlug as SectionSlug)
    ? (resolvedSectionSlug as SectionSlug)
    : null;
  const publishHref = isHubHome
    ? "/hub/clubs"
    : normalizedSectionContext
      ? `/articles/new?section=${normalizedSectionContext}`
      : "/articles/new";
  const publishLabel = isHubHome ? t("hud.clubsLabel") : t("hud.publishLabel");
  const publishAria = isHubHome ? t("hud.clubsAria") : t("hud.publishAria");
  const publishIconName: HudImageKey = isHubHome ? "clubs" : "publish";

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-40 md:bottom-10 md:left-1/2 md:w-[min(100%,900px)] md:-translate-x-1/2">
      {isAvatarView ? (
        <>
          <AvatarHudDesktop t={t} activeTab={currentAvatarTab} canAccessOwnerTabs={canAccessOwnerTabs} sprite={sprite} />
          <AvatarHudMobile t={t} activeTab={currentAvatarTab} canAccessOwnerTabs={canAccessOwnerTabs} sprite={sprite} />
        </>
      ) : isClubsView ? (
        clubSlug ? (
          <ClubsDetailHud t={t} clubSlug={clubSlug} activeView={clubsDetailView} />
        ) : (
          <ClubsHomeHud t={t} activeView={clubsListView} />
        )
      ) : (
        <>
          <DefaultHudDesktop
            t={t}
            avatarAlt={avatarAlt}
            image={image}
            sprite={sprite}
            canViewPanel={Boolean(canViewPanel)}
            publishHref={publishHref}
            publishLabel={publishLabel}
            publishAria={publishAria}
            publishIconName={publishIconName}
          />
          <DefaultHudMobile
            t={t}
            avatarAlt={avatarAlt}
            image={image}
            sprite={sprite}
            canViewPanel={Boolean(canViewPanel)}
            publishHref={publishHref}
            publishLabel={publishLabel}
            publishAria={publishAria}
            publishIconName={publishIconName}
          />
        </>
      )}
    </div>
  );
}

interface DefaultHudProps {
  t: TranslateFn;
  avatarAlt: string;
  image?: string | null;
  sprite?: string | null;
  canViewPanel: boolean;
  publishHref: string;
  publishLabel: string;
  publishAria: string;
  publishIconName: HudImageKey;
}

function DefaultHudDesktop({ avatarAlt, image, sprite, canViewPanel, publishHref, publishLabel, publishAria, publishIconName, t }: DefaultHudProps) {
  const homeLink = (
    <ReloadLink
      href="/hub"
      aria-label={t("hud.homeAria")}
      className="group flex flex-1 flex-col items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-center transition hover:border-white/40 hover:bg-white/10"
    >
      <span className="text-xs uppercase tracking-[0.35em] text-white/60">{t("hud.homeLabel")}</span>
      <HudIconImage name="homeHub" size={48} className="h-12 w-12 translate-y-[2px]" />
    </ReloadLink>
  );

  return (
    <div className="hidden pointer-events-auto rounded-4xl border border-white/15 bg-white/5 p-5 text-white shadow-[0_20px_60px_rgba(3,5,20,0.45)] backdrop-blur-xl md:block">
      <div className="flex flex-col gap-4 md:flex-row md:items-stretch">
        {homeLink}

        <Link
          href="/profile"
          aria-label={t("hud.profileAria")}
          className="group flex flex-1 flex-col items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-center transition hover:border-white/40 hover:bg-white/10"
        >
          <span className="text-xs uppercase tracking-[0.35em] text-white/60">{t("hud.profileLabel")}</span>
          <UserAvatar image={image ?? undefined} size={56} alt={avatarAlt} />
        </Link>

        <Link
          href={publishHref}
          aria-label={publishAria}
          className="flex flex-1 flex-col items-center gap-3 rounded-3xl border border-fuchsia-300/40 bg-fuchsia-500/10 px-4 py-3 text-center text-fuchsia-50 transition hover:border-fuchsia-200/80 hover:bg-fuchsia-500/20"
        >
          <span className="text-xs uppercase tracking-[0.35em]">{publishLabel}</span>
          <HudIconImage name={publishIconName} size={48} className="h-12 w-12" />
        </Link>

        <Link
          href="/avatar"
          aria-label={t("hud.avatarAria")}
          className="group flex flex-1 flex-col items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-center transition hover:border-white/40 hover:bg-white/10"
        >
          <span className="text-xs uppercase tracking-[0.35em] text-white/60">{t("hud.avatarLabel")}</span>
          <AvatarHeadIcon sprite={sprite} size={56} />
        </Link>

        {canViewPanel && (
          <Link
            href="/panel"
            aria-label={t("hud.panelAria")}
            className="flex flex-1 flex-col items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-center text-white transition hover:border-white/40 hover:bg-white/10"
          >
            <span className="text-xs uppercase tracking-[0.35em] text-white/60">{t("hud.panelLabel")}</span>
            <Shield className="h-5 w-5 text-white/80" />
          </Link>
        )}

        <NotificationBellButton
          placement="hud"
          unstyled
          aria-label={t("hud.notificationsAria")}
          className="flex flex-1 flex-col items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-center transition hover:border-white/40 hover:bg-white/10"
        >
          <span className="text-xs uppercase tracking-[0.35em] text-white/60">{t("hud.notificationsLabel")}</span>
          <HudIconImage name="notifications" size={44} className="h-11 w-11 translate-y-[2px]" />
        </NotificationBellButton>
      </div>
    </div>
  );
}

function DefaultHudMobile({ avatarAlt, image, sprite, canViewPanel, publishHref, publishAria, publishIconName, t }: DefaultHudProps) {
  const homeButton = (
    <ReloadLink href="/hub" aria-label={t("hud.homeAria")} className="flex h-12 w-12 items-center justify-center rounded-3xl border border-white/20 bg-white/10">
      <HudIconImage name="homeHub" size={40} className="h-10 w-10 translate-y-[1px]" />
    </ReloadLink>
  );

  return (
    <div className="pointer-events-auto flex items-center justify-between rounded-full border border-white/15 bg-slate-950/80 px-5 py-3 text-white shadow-[0_20px_45px_rgba(0,0,0,0.55)] backdrop-blur-xl md:hidden">
      {homeButton}

      <Link href="/profile" aria-label={t("hud.profileAria")} className="flex h-12 w-12 items-center justify-center rounded-3xl border border-white/20 bg-white/10">
        <UserAvatar image={image ?? undefined} size={40} alt={avatarAlt} />
      </Link>

      <Link
        href={publishHref}
        aria-label={publishAria}
        className="flex h-16 w-16 items-center justify-center rounded-3xl border border-fuchsia-300/60 bg-fuchsia-500/10 shadow-[0_15px_30px_rgba(236,72,153,0.25)]"
      >
        <HudIconImage name={publishIconName} size={44} className="h-12 w-12" />
      </Link>

      <Link href="/avatar" aria-label={t("hud.avatarAria")} className="flex h-12 w-12 items-center justify-center rounded-3xl border border-white/20 bg-white/10">
        <AvatarHeadIcon sprite={sprite} size={42} />
      </Link>

      {canViewPanel && (
        <Link
          href="/panel"
          aria-label={t("hud.panelAria")}
          className="flex h-12 w-12 items-center justify-center rounded-3xl border border-white/20 bg-white/10"
        >
          <Shield className="h-5 w-5" />
        </Link>
      )}

      <NotificationBellButton
        placement="hud"
        unstyled
        aria-label={t("hud.notificationsAria")}
        className="inline-flex h-12 w-12 items-center justify-center rounded-3xl border border-cyan-300/40 bg-cyan-500/15"
      >
        <HudIconImage name="notifications" size={36} className="h-9 w-9 translate-y-[1px]" />
      </NotificationBellButton>
    </div>
  );
}

interface AvatarHudVariantProps {
  t: TranslateFn;
  activeTab: AvatarTab;
  canAccessOwnerTabs: boolean;
  sprite?: string | null;
}

type AvatarTabLink =
  | { tab: AvatarTab; labelKey: string; ownerOnly?: boolean; iconName: HudImageKey }
  | { tab: AvatarTab; labelKey: string; ownerOnly?: boolean; Icon: LucideIcon }
  | { tab: AvatarTab; labelKey: string; ownerOnly?: boolean; avatarHead: true };

const AVATAR_TAB_LINKS: AvatarTabLink[] = [
  { labelKey: "hud.avatarTabs.battle", tab: "battle", iconName: "battle" },
  { labelKey: "hud.avatarTabs.market", tab: "market", iconName: "market", ownerOnly: true },
  { labelKey: "hud.avatarTabs.designer", tab: "designer", avatarHead: true },
  { labelKey: "hud.avatarTabs.ranking", tab: "ranking", iconName: "ranking", ownerOnly: true },
];

function AvatarHudDesktop({ activeTab, canAccessOwnerTabs, sprite, t }: AvatarHudVariantProps) {
  return (
    <div className="hidden pointer-events-auto rounded-4xl border border-white/15 bg-white/5 p-5 text-white shadow-[0_20px_60px_rgba(3,5,20,0.45)] backdrop-blur-xl md:block">
      <div className="flex flex-col gap-4 md:flex-row md:items-stretch">
        <ReloadLink
          href="/hub"
          className="group flex flex-1 flex-col items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-center transition hover:border-white/40 hover:bg-white/10"
        >
          <span className="text-xs uppercase tracking-[0.35em] text-white/60">{t("hud.homeLabel")}</span>
          <HudIconImage name="homeAvatar" size={56} className="h-14 w-14 translate-y-[2px]" />
        </ReloadLink>

        {AVATAR_TAB_LINKS.map((link) => {
          const { labelKey, tab, ownerOnly } = link;
          const isLocked = ownerOnly && !canAccessOwnerTabs;
          const isActive = activeTab === tab;
          const activeClasses = isActive
            ? "border-cyan-200/80 bg-white/10 shadow-[0_10px_30px_rgba(56,189,248,0.25)]"
            : "border-white/10 bg-white/5 hover:border-white/40 hover:bg-white/10";
          let iconNode: ReactNode;
          if ("avatarHead" in link) {
            iconNode = <AvatarHeadIcon sprite={sprite} size={60} />;
          } else if ("iconName" in link) {
            iconNode = <HudIconImage name={link.iconName} size={52} className="h-14 w-14" />;
          } else {
            iconNode = <link.Icon className="h-8 w-8" />;
          }
          return (
            <ReloadLink
              key={labelKey}
              href={`/avatar?tab=${tab}`}
              aria-current={isActive ? "page" : undefined}
              title={isLocked ? t("hud.avatarTabs.lockedTooltip") : undefined}
              className={`group flex flex-1 flex-col items-center gap-2 rounded-3xl px-4 py-3 text-center transition ${activeClasses} ${isLocked ? "opacity-65" : ""}`}
            >
              <span className="text-xs uppercase tracking-[0.35em] text-white/60">{t(labelKey)}</span>
              {iconNode}
              {isLocked && (
                <span className="text-[0.6rem] uppercase tracking-[0.25em] text-white/60">{t("hud.avatarTabs.lockedLabel")}</span>
              )}
            </ReloadLink>
          );
        })}
      </div>
    </div>
  );
}

function AvatarHudMobile({ activeTab, canAccessOwnerTabs, sprite, t }: AvatarHudVariantProps) {
  return (
    <div className="pointer-events-auto flex items-center justify-between rounded-full border border-white/15 bg-slate-950/90 px-4 py-3 text-white shadow-[0_20px_45px_rgba(0,0,0,0.65)] backdrop-blur-xl md:hidden">
      <ReloadLink
        href="/hub"
        aria-label={t("hud.avatarTabs.homeAria")}
        className="flex h-11 w-11 flex-col items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-[0.55rem] uppercase tracking-[0.18em] text-white/70"
      >
        <HudIconImage name="homeAvatar" size={42} className="h-10 w-10 translate-y-[1px]" />
      </ReloadLink>
      {AVATAR_TAB_LINKS.map((link) => {
        const { labelKey, tab, ownerOnly } = link;
        const isLocked = ownerOnly && !canAccessOwnerTabs;
        const isActive = activeTab === tab;
        const activeClasses = isActive
          ? "border-cyan-200/80 bg-white/10"
          : "border-white/15 bg-white/5";
        let iconNode: ReactNode;
        if ("avatarHead" in link) {
          iconNode = <AvatarHeadIcon sprite={sprite} size={44} />;
        } else if ("iconName" in link) {
          iconNode = <HudIconImage name={link.iconName} size={36} className="h-10 w-10" />;
        } else {
          iconNode = <link.Icon className="h-6 w-6" />;
        }
        return (
          <ReloadLink
            key={labelKey}
            href={`/avatar?tab=${tab}`}
            aria-label={t(labelKey)}
            title={isLocked ? t("hud.avatarTabs.lockedTooltip") : undefined}
            className={`flex h-11 w-11 flex-col items-center justify-center rounded-2xl text-[0.55rem] uppercase tracking-[0.18em] text-white/70 ${activeClasses} ${isLocked ? "opacity-65" : ""}`}
          >
            {iconNode}
          </ReloadLink>
        );
      })}
    </div>
  );
}

interface ReloadLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

function ReloadLink({ href, children, ...props }: ReloadLinkProps) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}

function HudIconImage({ name, size = 32, className }: { name: HudImageKey; size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center ${className ?? ""}`} aria-hidden="true">
      <Image src={HUD_IMAGE_PATHS[name]} alt="" width={size} height={size} />
    </span>
  );
}

function ClubsHomeHud({ t, activeView }: { t: TranslateFn; activeView: "discover" | "mine" }) {
  const buttons = [
    {
      label: t("hud.homeLabel"),
      href: "/hub",
      icon: <Home className="h-5 w-5" />,
      active: false,
      reload: true,
    },
    {
      label: t("hud.clubsPrimary"),
      href: "/hub/clubs",
      icon: <Users className="h-5 w-5" />,
      active: activeView === "discover",
    },
    {
      label: t("hud.myClubsLabel"),
      href: "/hub/clubs?view=mine#mis-clubs",
      icon: <Users className="h-5 w-5" />,
      active: activeView === "mine",
    },
  ];
  return (
    <>
      <div className="hidden pointer-events-auto rounded-4xl border border-white/15 bg-white/5 p-5 text-white shadow-[0_20px_60px_rgba(3,5,20,0.45)] backdrop-blur-xl md:block">
        <div className="flex items-stretch gap-4">
          {buttons.map((button) => {
            const desktopClass = button.active
              ? "flex flex-1 items-center justify-center gap-2 rounded-3xl border border-cyan-200/70 bg-cyan-500/15 px-4 py-3 text-sm uppercase tracking-[0.3em]"
              : "flex flex-1 items-center justify-center gap-2 rounded-3xl border border-white/15 bg-white/5 px-4 py-3 text-sm uppercase tracking-[0.3em] text-white/70 hover:border-white/40 hover:text-white";
            return button.reload ? (
              <ReloadLink key={button.href} href={button.href} className={desktopClass}>
                {button.icon}
                {button.label}
              </ReloadLink>
            ) : (
              <Link key={button.href} href={button.href} className={desktopClass}>
                {button.icon}
                {button.label}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="pointer-events-auto flex items-center justify-between rounded-full border border-white/15 bg-slate-950/80 px-4 py-3 text-white shadow-[0_20px_45px_rgba(0,0,0,0.55)] backdrop-blur-xl md:hidden">
        {buttons.map((button) => {
          const mobileClass = button.active
            ? "flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-200/70 bg-cyan-500/15"
            : "flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/5";
          return button.reload ? (
            <ReloadLink key={button.href} href={button.href} className={mobileClass}>
              {button.icon}
            </ReloadLink>
          ) : (
            <Link key={button.href} href={button.href} className={mobileClass}>
              {button.icon}
            </Link>
          );
        })}
      </div>
    </>
  );
}

function ClubsDetailHud({ t, clubSlug, activeView }: { t: TranslateFn; clubSlug: string; activeView: "chat" | "rules" }) {
  const buttons = [
    { label: t("hud.homeLabel"), href: "/hub", icon: <Home className="h-5 w-5" />, active: false, reload: true },
    { label: t("hud.clubsPrimary"), href: "/hub/clubs", icon: <Users className="h-5 w-5" />, active: false },
    {
      label: t("hud.clubChatLabel"),
      href: `/hub/clubs/${clubSlug}?view=chat`,
      icon: <MessageCircle className="h-5 w-5" />,
      active: activeView === "chat",
    },
    {
      label: t("hud.clubRulesLabel"),
      href: `/hub/clubs/${clubSlug}?view=rules`,
      icon: <ScrollText className="h-5 w-5" />,
      active: activeView === "rules",
    },
  ];
  return (
    <>
      <div className="hidden pointer-events-auto rounded-4xl border border-white/15 bg-white/5 p-5 text-white shadow-[0_20px_60px_rgba(3,5,20,0.45)] backdrop-blur-xl md:block">
        <div className="flex items-stretch gap-4">
          {buttons.map((button) => {
            const desktopClass = button.active
              ? "flex flex-1 items-center justify-center gap-2 rounded-3xl border border-fuchsia-200/70 bg-fuchsia-500/15 px-4 py-3 text-sm uppercase tracking-[0.3em]"
              : "flex flex-1 items-center justify-center gap-2 rounded-3xl border border-white/15 bg-white/5 px-4 py-3 text-sm uppercase tracking-[0.3em] text-white/70 hover:border-white/40 hover:text-white";
            return button.reload ? (
              <ReloadLink key={button.href} href={button.href} className={desktopClass}>
                {button.icon}
                {button.label}
              </ReloadLink>
            ) : (
              <Link key={button.href} href={button.href} className={desktopClass}>
                {button.icon}
                {button.label}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="pointer-events-auto flex items-center justify-between rounded-full border border-white/15 bg-slate-950/80 px-4 py-3 text-white shadow-[0_20px_45px_rgba(0,0,0,0.55)] backdrop-blur-xl md:hidden">
        {buttons.map((button) => {
          const mobileClass = button.active
            ? "flex h-11 w-11 items-center justify-center rounded-2xl border border-fuchsia-200/70 bg-fuchsia-500/15"
            : "flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/5";
          return button.reload ? (
            <ReloadLink key={button.href} href={button.href} className={mobileClass}>
              {button.icon}
            </ReloadLink>
          ) : (
            <Link key={button.href} href={button.href} className={mobileClass}>
              {button.icon}
            </Link>
          );
        })}
      </div>
    </>
  );
}

function AvatarHeadIcon({ sprite, size = 56 }: { sprite?: string | null; size?: number }) {
  const normalized = useMemo(() => parsePixelSprite(sprite), [sprite]);
  return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      <div
        className="grid h-full w-full gap-[0.5px]"
        style={{
          gridTemplateColumns: `repeat(${HEAD_CANVAS.cols}, 1fr)`,
          gridTemplateRows: `repeat(${HEAD_CANVAS.rows}, 1fr)`,
        }}
      >
        {normalized.head.map((color, index) => (
          <span
            key={index}
            className="block h-full w-full rounded-[1px]"
            style={{ backgroundColor: color ?? "transparent" }}
          />
        ))}
      </div>
    </div>
  );
}
