"use client";

import { FormEvent, useState } from "react";

type AvatarStatEditorProps = {
  userId: string;
  avatarId: string;
  stats: {
    maxHp: number;
    currentHp: number;
    damage: number;
    evasion: number;
  };
  onUpdated?: () => void;
};

export function AvatarStatEditor({ userId, avatarId, stats, onUpdated }: AvatarStatEditorProps) {
  const [maxHp, setMaxHp] = useState(stats.maxHp.toString());
  const [currentHp, setCurrentHp] = useState(stats.currentHp.toString());
  const [damage, setDamage] = useState(stats.damage.toString());
  const [evasion, setEvasion] = useState(stats.evasion.toString());
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function parseField(value: string) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch("/api/panel/avatar/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          avatarId,
          maxHp: parseField(maxHp),
          currentHp: parseField(currentHp),
          damage: parseField(damage),
          evasion: parseField(evasion),
        }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error ?? "No se pudo guardar");
      }
      const payload = await response.json();
      const updated = payload?.avatar;
      if (updated) {
        setMaxHp(updated.maxHp.toString());
        setCurrentHp(updated.currentHp.toString());
        setDamage(updated.damage.toString());
        setEvasion(updated.evasion.toString());
      }
      setStatus("Atributos actualizados");
      onUpdated?.();
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-emerald-200/30 bg-emerald-400/5 p-4 text-sm text-white/80">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/50">
        <span>Atributos del avatar</span>
        <span className="text-[10px] text-emerald-200">Solo Dueño</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs text-white/60">Vida máxima</span>
          <input
            type="number"
            min={1}
            value={maxHp}
            onChange={(event) => setMaxHp(event.target.value)}
            className="w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-white/60">Vida actual</span>
          <input
            type="number"
            min={1}
            value={currentHp}
            onChange={(event) => setCurrentHp(event.target.value)}
            className="w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-white/60">Daño base</span>
          <input
            type="number"
            min={1}
            value={damage}
            onChange={(event) => setDamage(event.target.value)}
            className="w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-white/60">Evasión (%)</span>
          <input
            type="number"
            min={0}
            max={95}
            value={evasion}
            onChange={(event) => setEvasion(event.target.value)}
            className="w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-50"
      >
        {submitting ? "Guardando..." : "Guardar cambios"}
      </button>
      {status && <p className="text-xs text-white/60">{status}</p>}
    </form>
  );
}
