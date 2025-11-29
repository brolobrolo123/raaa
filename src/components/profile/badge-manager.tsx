"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { DEFAULT_MINI_PROFILE_ACCENT, MINI_PROFILE_ACCENTS } from "@/lib/mini-profile";
import type { OwnedBadgeDTO } from "@/types/profile";

interface ProfileBadgeManagerProps {
  initialBadges: OwnedBadgeDTO[];
  initialAccent?: string | null;
}

const getSelectionFromBadges = (badges: OwnedBadgeDTO[]) =>
  badges
    .filter((badge) => badge.featuredSlot !== null)
    .sort((a, b) => (a.featuredSlot ?? 0) - (b.featuredSlot ?? 0))
    .map((badge) => badge.id);

export function ProfileBadgeManager({ initialBadges, initialAccent }: ProfileBadgeManagerProps) {
  const [badges, setBadges] = useState<OwnedBadgeDTO[]>(initialBadges);
  const [selected, setSelected] = useState<string[]>(getSelectionFromBadges(initialBadges));
  const [accent, setAccent] = useState<string>(initialAccent ?? DEFAULT_MINI_PROFILE_ACCENT);
  const [savedAccent, setSavedAccent] = useState<string>(initialAccent ?? DEFAULT_MINI_PROFILE_ACCENT);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saved">("idle");
  const [isPending, startTransition] = useTransition();

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
          throw new Error("No se pudo guardar la selección.");
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
        setError(caught instanceof Error ? caught.message : "Error inesperado.");
      }
    });
  };

  return (
    <Card className="border-white/10 bg-white/10 p-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Personalizar miniperfil</p>
          <h2 className="text-2xl font-semibold">Elige tus placas y fondo</h2>
          <p className="text-sm text-slate-300">Selecciona las placas destacadas y el color del banner del miniperfil.</p>
        </div>
        <div className="flex flex-col items-end gap-2 text-sm">
          {error && <span className="text-rose-300">{error}</span>}
          {status === "saved" && <span className="text-emerald-300">Cambios guardados</span>}
          <Button
            type="button"
            variant="primary"
            disabled={!hasChanges || isPending || badges.length === 0}
            loading={isPending}
            onClick={handleSave}
            className="rounded-2xl"
          >
            Guardar destacados
          </Button>
        </div>
      </div>

      {badges.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-white/20 bg-black/20 p-4 text-sm text-slate-300">
          Aún no tienes placas. Sigue participando en la comunidad para desbloquearlas automáticamente.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {badges.map((badge) => {
            const selectionIndex = selected.indexOf(badge.id);
            const isSelected = selectionIndex !== -1;
            return (
              <button
                type="button"
                key={badge.id}
                onClick={() => toggleBadge(badge.id)}
                className={cn(
                  "relative flex h-full w-full flex-col gap-2 rounded-3xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-white/40",
                  isSelected && "border-sky-400/80 bg-slate-900/60 shadow-[0_10px_25px_rgba(56,189,248,0.35)]",
                )}
              >
                <div className="flex items-center gap-3 text-2xl">
                  <span aria-hidden>{badge.icon ?? "★"}</span>
                  <div>
                    <p className="text-base font-semibold text-white">{badge.name}</p>
                    <p className="text-sm text-slate-300">{badge.description}</p>
                    <p className="text-xs text-slate-400">
                      Obtenida el {new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(badge.earnedAt))}
                    </p>
                  </div>
                </div>
                {isSelected && (
                  <span className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-sky-400/70 bg-sky-500/20 text-sm font-semibold text-sky-100">
                    {selectionIndex + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {selected.length >= 4 && badges.length > 0 && (
        <p className="mt-4 text-xs text-amber-300">Ya seleccionaste cuatro placas. Quita una para agregar otra diferente.</p>
      )}
      <div className="mt-8 space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Fondo del miniperfil</p>
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
                aria-label={`Elegir color ${color}`}
              >
                {isActive && <span className="text-sm font-semibold text-white">Seleccionado</span>}
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
