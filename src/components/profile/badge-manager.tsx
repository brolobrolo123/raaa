"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { useLocale, useTranslations } from "@/lib/i18n/client";
import { DEFAULT_MINI_PROFILE_ACCENT, MINI_PROFILE_ACCENTS } from "@/lib/mini-profile";
import type { OwnedBadgeDTO } from "@/types/profile";

interface ProfileBadgeManagerProps {
  initialBadges: OwnedBadgeDTO[];
  initialAccent?: string | null;
  viewAllLabel?: string;
  collapseLabel?: string;
}

const getSelectionFromBadges = (badges: OwnedBadgeDTO[]) =>
  badges
    .filter((badge) => badge.featuredSlot !== null)
    .sort((a, b) => (a.featuredSlot ?? 0) - (b.featuredSlot ?? 0))
    .map((badge) => badge.id);

export function ProfileBadgeManager({
  initialBadges,
  initialAccent,
  viewAllLabel = "Ver todas las placas",
  collapseLabel = "Mostrar menos placas",
}: ProfileBadgeManagerProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [badges, setBadges] = useState<OwnedBadgeDTO[]>(initialBadges);
  const [selected, setSelected] = useState<string[]>(getSelectionFromBadges(initialBadges));
  const [accent, setAccent] = useState<string>(initialAccent ?? DEFAULT_MINI_PROFILE_ACCENT);
  const [savedAccent, setSavedAccent] = useState<string>(initialAccent ?? DEFAULT_MINI_PROFILE_ACCENT);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saved">("idle");
  const [isPending, startTransition] = useTransition();
  const [showAllBadges, setShowAllBadges] = useState(false);

  useEffect(() => {
    setBadges(initialBadges);
    setSelected(getSelectionFromBadges(initialBadges));
  }, [initialBadges]);

  useEffect(() => {
    setAccent(initialAccent ?? DEFAULT_MINI_PROFILE_ACCENT);
    setSavedAccent(initialAccent ?? DEFAULT_MINI_PROFILE_ACCENT);
  }, [initialAccent]);

  const savedSelection = useMemo(() => getSelectionFromBadges(badges), [badges]);
  const hasChanges = useMemo(() => {
    if (selected.length !== savedSelection.length) {
      return true;
    }
    if (selected.some((id, index) => savedSelection[index] !== id)) {
      return true;
    }
    return accent !== savedAccent;
  }, [selected, savedSelection, accent, savedAccent]);

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-US", { dateStyle: "medium" }),
    [locale],
  );

  const toggleBadge = (badgeId: string) => {
    setError(null);
    setSelected((prev) => {
      if (prev.includes(badgeId)) {
        return prev.filter((id) => id !== badgeId);
      }
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, badgeId];
    });
  };

  const handleSave = () => {
    if (!hasChanges) return;
    startTransition(async () => {
      try {
        setError(null);
        const response = await fetch("/api/profile/badges", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ featured: selected, accentColor: accent }),
        });
        if (!response.ok) {
          throw new Error(t("profilePage.badgeManager.error"));
        }
        const payload = (await response.json()) as { badges: OwnedBadgeDTO[]; accentColor?: string };
        setBadges(payload.badges);
        setSelected(getSelectionFromBadges(payload.badges));
        const nextAccent = payload.accentColor ?? DEFAULT_MINI_PROFILE_ACCENT;
        setSavedAccent(nextAccent);
        setAccent(nextAccent);
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 2500);
        window.setTimeout(() => window.location.reload(), 200);
      } catch (caught) {
        console.error(caught);
        setError(caught instanceof Error ? caught.message : t("profilePage.badgeManager.genericError"));
      }
    });
  };

  const hasManyBadges = badges.length > 8;
  const visibleBadges = showAllBadges ? badges : badges.slice(0, 8);

  return (
    <Card className="border-white/10 bg-white/10 p-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t("profilePage.badgeManager.title")}</p>
          <h2 className="text-2xl font-semibold">{t("profilePage.badgeManager.subtitle")}</h2>
          <p className="text-sm text-slate-300">{t("profilePage.badgeManager.description")}</p>
        </div>
        <div className="flex flex-col items-end gap-2 text-sm">
          {error && <span className="text-rose-300">{error}</span>}
          {status === "saved" && <span className="text-emerald-300">{t("profilePage.badgeManager.saved")}</span>}
          <Button
            type="button"
            variant="primary"
            disabled={!hasChanges || isPending || badges.length === 0}
            loading={isPending}
            onClick={handleSave}
            className="rounded-2xl"
          >
            {t("profilePage.badgeManager.save")}
          </Button>
        </div>
      </div>

        {badges.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-white/20 bg-black/20 p-4 text-sm text-slate-300">
            {t("profilePage.badgeManager.empty")}
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t("profilePage.badgeManager.featuredLabel")}</p>
              {hasManyBadges && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-xs tracking-[0.3em] text-slate-200"
                  onClick={() => setShowAllBadges((prev) => !prev)}
                >
                  {showAllBadges ? collapseLabel : viewAllLabel}
                </Button>
              )}
            </div>
            <div className="grid grid-cols-4 gap-3">
              {visibleBadges.map((badge) => {
                const selectionIndex = selected.indexOf(badge.id);
                const isSelected = selectionIndex !== -1;
                return (
                  <button
                    key={badge.id}
                    type="button"
                    onClick={() => toggleBadge(badge.id)}
                    className={cn(
                      "group relative flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-white/15 bg-slate-950/50 text-3xl transition hover:border-white/30",
                      isSelected && "border-sky-400/80 bg-slate-900/70 shadow-[0_8px_20px_rgba(56,189,248,0.35)]",
                    )}
                  >
                    <span aria-hidden className="text-3xl">
                      {badge.icon ?? "★"}
                    </span>
                    {isSelected && (
                      <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border border-sky-400/80 bg-sky-500/20 text-xs leading-none text-sky-100">
                        {selectionIndex + 1}
                      </span>
                    )}
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center rounded-3xl border-2 border-white/30 bg-slate-900/90 px-3 text-center text-xs opacity-0 transition group-hover:opacity-100">
                      <p className="font-semibold text-white">{badge.name}</p>
                      <p className="text-[11px] text-slate-300">{badge.description}</p>
                      <p className="text-[10px] text-slate-400">
                        {dateFormatter.format(new Date(badge.earnedAt))}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      {selected.length >= 4 && badges.length > 0 && (
        <p className="mt-4 text-xs text-amber-300">{t("profilePage.badgeManager.maxWarning")}</p>
      )}
      <div className="mt-8 space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t("profilePage.badgeManager.backgroundLabel")}</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MINI_PROFILE_ACCENTS.map((color) => {
            const isActive = color === accent;
            return (
              <button
                type="button"
                key={color}
                onClick={() => setAccent(color)}
                className={cn(
                  "relative flex h-16 items-center justify-center rounded-2xl border-2 transition",
                  isActive ? "border-white" : "border-transparent hover:border-white/40",
                )}
                style={{
                  background: `linear-gradient(135deg, ${color}cc, #050915f2)`,
                  boxShadow: isActive ? "0 10px 25px rgba(15,23,42,0.45)" : undefined,
                }}
                aria-label={t("profilePage.badgeManager.pickAccent").replace("{color}", color)}
              >
                {isActive && <span className="text-sm font-semibold text-white">{t("profilePage.badgeManager.selected")}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
