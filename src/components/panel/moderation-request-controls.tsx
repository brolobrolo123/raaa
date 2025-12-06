"use client";

import { useState } from "react";

type ModerationRequestControlsProps = {
  requestId: string;
};

export function ModerationRequestControls({ requestId }: ModerationRequestControlsProps) {
  const [status, setStatus] = useState<string | null>(null);

  async function handle(action: "approve" | "reject") {
    setStatus("Procesando...");
    try {
      const response = await fetch("/api/panel/moderation-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error ?? "Error inesperado");
      }
      const data = await response.json();
      setStatus(data.status);
    } catch (error) {
      setStatus((error as Error).message);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handle("approve")}
        className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white"
      >
        Aprobar
      </button>
      <button
        onClick={() => handle("reject")}
        className="rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold text-white"
      >
        Rechazar
      </button>
      {status && <span className="text-[11px] text-white/60">{status}</span>}
    </div>
  );
}
