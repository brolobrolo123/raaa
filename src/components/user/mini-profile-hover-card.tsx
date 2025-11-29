"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { DEFAULT_MINI_PROFILE_ACCENT } from "@/lib/mini-profile";
import type { MiniProfileDTO } from "@/types/profile";
import { UserAvatar } from "./user-avatar";

interface MiniProfileHoverCardProps {
  username?: string;
  children: ReactNode;
  className?: string;
  align?: "left" | "right";
}

const profileCache = new Map<string, MiniProfileDTO>();

export function MiniProfileHoverCard({ username, children, className, align = "left" }: MiniProfileHoverCardProps) {
  const normalizedUsername = username?.trim();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<MiniProfileDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const alignmentClass = align === "right" ? "right-0" : "left-0";

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
      onFocus={handleOpen}
      onBlur={handleClose}
    >
      {children}
      {open && (
        <div
          className={cn(
            "absolute z-50 mt-3 w-80 max-w-sm rounded-3xl border p-4 text-white shadow-2xl backdrop-blur",
            alignmentClass,
          )}
          style={{
            borderColor: `${(data?.accentColor ?? DEFAULT_MINI_PROFILE_ACCENT)}33`,
            background: `linear-gradient(150deg, ${(data?.accentColor ?? DEFAULT_MINI_PROFILE_ACCENT)}ee, rgba(2,6,23,0.95))`,
          }}
          onMouseEnter={handleOpen}
          onMouseLeave={handleClose}
        >
          <MiniProfileCard data={data} loading={loading} error={error} />
        </div>
      )}
    </span>
  );
}

interface MiniProfileCardProps {
  data: MiniProfileDTO | null;
  loading: boolean;
  error: string | null;
}

function MiniProfileCard({ data, loading, error }: MiniProfileCardProps) {
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
  const joinedLabel = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(data.joinedAt));

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
      <div className="flex gap-4 text-xs text-slate-300">
        <span className="flex flex-col">
          <strong className="text-lg text-white">{data.stats.articles}</strong>
          <span>Artículos</span>
        </span>
        <span className="flex flex-col">
          <strong className="text-lg text-white">{data.stats.comments}</strong>
          <span>Comentarios</span>
        </span>
      </div>
      {data.topArticle && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Lo más votado</p>
          <p className="font-semibold text-white">{data.topArticle.title}</p>
          <p className="text-xs text-slate-400">{data.topArticle.score} votos</p>
        </div>
      )}
      {data.latestComment && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Último comentario</p>
          <p className="text-white/90">{truncateText(data.latestComment.body, 140)}</p>
          <p className="mt-2 text-xs text-slate-400">En {data.latestComment.articleTitle}</p>
        </div>
      )}
      <div>
        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Placas</p>
        {data.badges.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">Sin placas destacadas todavía.</p>
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

function truncateText(text: string, limit: number) {
  const normalized = text.trim();
  if (normalized.length <= limit) {
    return normalized;
  }
  return `${normalized.slice(0, limit)}…`;
}
