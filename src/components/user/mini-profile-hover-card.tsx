"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "@/lib/i18n/client";
import { cn } from "@/lib/cn";
import { DEFAULT_MINI_PROFILE_ACCENT } from "@/lib/mini-profile";
import type { MiniProfileDTO } from "@/types/profile";
import { UserAvatar } from "./user-avatar";

interface MiniProfileHoverCardProps {
  username?: string;
  children: ReactNode;
  className?: string;
  align?: "left" | "right";
  variant?: "forum" | "battle";
}

const profileCache = new Map<string, MiniProfileDTO>();

export function MiniProfileHoverCard({
  username,
  children,
  className,
  align = "left",
  variant = "forum",
}: MiniProfileHoverCardProps) {
  const normalizedUsername = username?.trim();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<MiniProfileDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null);
  const [portalStyle, setPortalStyle] = useState<{ top: number; left?: number; right?: number }>({ top: 0 });

  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const fetchProfile = useCallback(async () => {
    if (!normalizedUsername) return;
    const cacheKey = normalizedUsername.toLowerCase();
    if (profileCache.has(cacheKey)) {
      setData(profileCache.get(cacheKey)!);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(normalizedUsername)}/mini-profile`, {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as MiniProfileDTO | { error?: string } | null;
      if (!response.ok || !payload || Array.isArray(payload)) {
        const message = (payload as { error?: string } | null)?.error ?? "No se pudo cargar el miniperfil.";
        setError(message);
        return;
      }
      const typedPayload = payload as MiniProfileDTO;
      profileCache.set(cacheKey, typedPayload);
      setData(typedPayload);
    } catch {
      setError("No se pudo cargar el miniperfil.");
    } finally {
      setLoading(false);
    }
  }, [normalizedUsername]);

  useEffect(() => {
    setData(null);
    setError(null);
    setOpen(false);
  }, [normalizedUsername]);

  const handleOpen = () => {
    if (!normalizedUsername) {
      setError("Usuario no especificado.");
      setOpen(false);
      return;
    }
    clearTimer();
    setOpen(true);
    if (!data && !loading) {
      void fetchProfile();
    }
  };

  const handleClose = () => {
    clearTimer();
    timer.current = setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => () => clearTimer(), []);

  const updatePortalPosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    const top = rect.bottom + 12;
    setPortalStyle({
      top,
      ...(align === "right"
        ? { right: window.innerWidth - rect.right }:
        { left: rect.left }),
    });
  }, [align]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }
    const el = document.createElement("div");
    el.setAttribute("data-mini-profile-portal", "true");
    document.body.appendChild(el);
    setPortalElement(el);
    return () => {
      document.body.removeChild(el);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    updatePortalPosition();
    window.addEventListener("resize", updatePortalPosition);
    window.addEventListener("scroll", updatePortalPosition, true);
    return () => {
      window.removeEventListener("resize", updatePortalPosition);
      window.removeEventListener("scroll", updatePortalPosition, true);
    };
  }, [open, updatePortalPosition]);

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
      onFocus={handleOpen}
      onBlur={handleClose}
      ref={triggerRef}
    >
      {children}
      {portalElement && open
        ? createPortal(
            <div
              className="z-[10000] rounded-3xl border p-4 text-white shadow-2xl backdrop-blur"
              style={{
                position: "fixed",
                top: portalStyle.top,
                left: portalStyle.left,
                right: portalStyle.right,
                borderColor: `${(data?.accentColor ?? DEFAULT_MINI_PROFILE_ACCENT)}33`,
                background: `linear-gradient(150deg, ${(data?.accentColor ?? DEFAULT_MINI_PROFILE_ACCENT)}ee, rgba(2,6,23,0.95))`,
              }}
              onMouseEnter={handleOpen}
              onMouseLeave={handleClose}
            >
              <MiniProfileCard data={data} loading={loading} error={error} variant={variant} />
            </div>,
            portalElement,
          )
        : null}
    </span>
  );
}

interface MiniProfileCardProps {
  data: MiniProfileDTO | null;
  loading: boolean;
  error: string | null;
  variant: "forum" | "battle";
}

function MiniProfileCard({ data, loading, error, variant }: MiniProfileCardProps) {
  const locale = useLocale();
  const t = useTranslations();
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-US"),
    [locale],
  );
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 w-32 rounded-full bg-white/10" />
        <div className="h-4 w-full rounded-full bg-white/10" />
        <div className="h-4 w-5/6 rounded-full bg-white/10" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-rose-300">{error}</p>;
  }

  if (!data) {
    return <p className="text-sm text-slate-400">Selecciona un perfil para ver más detalles.</p>;
  }

  const relativeLastSeen = formatRelativeTime(data.lastSeenAt);
  const joinedLabel = new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-US", { dateStyle: "medium" }).format(
    new Date(data.joinedAt),
  );

  const battleStats = data.battleStats;
  const formattedBattleTotal = numberFormatter.format(battleStats?.total ?? 0);
  const formattedBattleWins = numberFormatter.format(battleStats?.wins ?? 0);
  const formattedBattleLosses = numberFormatter.format(battleStats?.losses ?? 0);
  const formattedArticles = numberFormatter.format(data.stats.articles);
  const formattedVotes = numberFormatter.format(data.stats.votes);

  const forumStatsSection = (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
          {t("profilePage.miniProfileForumStats.totalPosts")}
        </p>
        <p className="text-3xl font-semibold text-white">{formattedArticles}</p>
        <div className="mt-3 text-[11px] uppercase tracking-[0.2em] text-white/70">
          <span>{t("profilePage.miniProfileForumStats.votes")}</span>
          <p className="text-2xl font-semibold text-amber-100">{formattedVotes}</p>
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
          {t("profilePage.miniProfileForumStats.topArticleHeading")}
        </p>
        {data.topArticle ? (
          <>
            <p className="font-semibold text-white">{data.topArticle.title}</p>
            <p className="text-xs text-slate-400">
              {numberFormatter.format(data.topArticle.score)} {t("common.votes")}
            </p>
          </>
        ) : (
          <p className="text-xs text-slate-500">{t("profilePage.miniProfileForumStats.topArticleEmpty")}</p>
        )}
      </div>
    </div>
  );

  const battleStatsSection = (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
          {t("profilePage.miniProfileBattleStats.total")}
        </p>
        <p className="text-3xl font-semibold text-white">{formattedBattleTotal}</p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-[11px] uppercase tracking-[0.2em] text-white/70">
          <div className="rounded-xl border border-white/10 bg-white/5 p-2">
            <p className="text-[10px] text-white/70">{t("profilePage.miniProfileBattleStats.wins")}</p>
            <p className="text-2xl font-semibold text-emerald-200">{formattedBattleWins}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-2">
            <p className="text-[10px] text-white/70">{t("profilePage.miniProfileBattleStats.losses")}</p>
            <p className="text-2xl font-semibold text-rose-200">{formattedBattleLosses}</p>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
          {t("profilePage.miniProfileBattleStats.clubHeading")}
        </p>
        <p className="text-sm text-slate-300">{t("profilePage.miniProfileBattleStats.clubPlaceholder")}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <UserAvatar image={data.avatar} size={48} className="border border-white/15" />
        <div>
          <p className="text-lg font-semibold">@{data.username}</p>
          <p className="text-xs text-slate-400">Última conexión {relativeLastSeen}</p>
          <p className="text-xs text-slate-500">Miembro desde {joinedLabel}</p>
        </div>
      </div>
      {data.bio && <p className="text-sm text-white/80">{data.bio}</p>}
      {variant === "battle" ? battleStatsSection : forumStatsSection}
      <div>
        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
          {t("profilePage.miniProfileBadgesTitle")}
        </p>
        {data.badges.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">{t("profilePage.miniProfileBadgesEmpty")}</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {data.badges.map((badge) => (
              <span
                key={badge.userBadgeId}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-1 text-xs text-white"
              >
                <span className="text-base" aria-hidden>
                  {badge.icon ?? "★"}
                </span>
                <span>{badge.name}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatRelativeTime(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return "recién";
  }
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return "hace instantes";
  if (diff < 3_600_000) {
    const minutes = Math.max(1, Math.floor(diff / 60_000));
    return `hace ${minutes} min`;
  }
  if (diff < 86_400_000) {
    const hours = Math.max(1, Math.floor(diff / 3_600_000));
    return `hace ${hours} h`;
  }
  const days = Math.floor(diff / 86_400_000);
  if (days < 7) {
    return `hace ${days} d`;
  }
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(date);
}

