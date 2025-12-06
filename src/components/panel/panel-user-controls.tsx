"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/i18n/client";

const BAN_OPTIONS = [
  { label: "1 hora", minutes: 60 },
  { label: "4 horas", minutes: 240 },
  { label: "1 día", minutes: 1440 },
  { label: "1 semana", minutes: 10080 },
];

const SILENCE_OPTIONS = [
  { label: "30 min", minutes: 30 },
  { label: "2 horas", minutes: 120 },
  { label: "1 día", minutes: 1440 },
];

type PanelUserControlsProps = {
  userId: string;
  bannedUntil?: string | null;
  silencedUntil?: string | null;
  permanentBan?: boolean;
  onActionSuccess?: () => void;
};

export function PanelUserControls({ userId, bannedUntil, silencedUntil, permanentBan, onActionSuccess }: PanelUserControlsProps) {
  const t = useTranslations();
  const [banDuration, setBanDuration] = useState(BAN_OPTIONS[1].minutes);
  const [silenceDuration, setSilenceDuration] = useState(SILENCE_OPTIONS[1].minutes);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function handleAction(action: "ban" | "unban" | "silence" | "warn", options?: { permanent?: boolean }) {
    setStatus("Procesando...");
    const payload: Record<string, unknown> = { userId, action };
    if (action === "ban") {
      payload.reason = reason || "Violación de normas";
      if (options?.permanent) {
        payload.permanent = true;
      } else {
        payload.durationMinutes = banDuration;
      }
    }
    if (action === "silence") {
      payload.durationMinutes = silenceDuration;
      payload.reason = reason || "Silencio temporal";
    }
    if (action === "warn") {
      payload.reason = reason || "Advertencia oficial";
    }
    try {
      const response = await fetch("/api/panel/users/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error ?? "Error inesperado");
      }
      setStatus("Acción realizada");
      onActionSuccess?.();
    } catch (error) {
      setStatus((error as Error).message);
    }
  }

  return (
    <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/70">
      {permanentBan ? (
        <p className="text-justify text-rose-300 font-semibold">{t("common.permanentBanStatus")}</p>
      ) : bannedUntil ? (
        <p className="text-justify text-red-300">Baneado hasta {new Date(bannedUntil).toLocaleString()}</p>
      ) : null}
      {silencedUntil && <p className="text-justify text-amber-200">Silenciado hasta {new Date(silencedUntil).toLocaleString()}</p>}
      <div className="grid gap-2 text-sm">
        <label className="flex flex-col gap-1">
          Motivo / contexto
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="breve descripción"
            className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm text-white outline-none"
          />
        </label>
        <div className="flex flex-wrap items-center gap-1">
          <select
            value={banDuration}
            onChange={(event) => setBanDuration(Number(event.target.value))}
            className="rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs"
          >
            {BAN_OPTIONS.map((option) => (
              <option key={option.minutes} value={option.minutes}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => handleAction("ban")}
            className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white"
          >
            Banear
          </button>
          <button
            onClick={() => handleAction("ban", { permanent: true })}
            className="rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white"
          >
            Ban permanente
          </button>
          <button
            onClick={() => handleAction("unban")}
            className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white"
          >
            Desbanear
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <select
            value={silenceDuration}
            onChange={(event) => setSilenceDuration(Number(event.target.value))}
            className="rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs"
          >
            {SILENCE_OPTIONS.map((option) => (
              <option key={option.minutes} value={option.minutes}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => handleAction("silence")}
            className="rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white"
          >
            Silenciar
          </button>
          <button
            onClick={() => handleAction("warn")}
            className="rounded-full bg-yellow-500 px-3 py-1 text-xs font-semibold text-black"
          >
            Advertir
          </button>
        </div>
        {status && <p className="text-[11px] text-white/60">{status}</p>}
      </div>
    </div>
  );
}
