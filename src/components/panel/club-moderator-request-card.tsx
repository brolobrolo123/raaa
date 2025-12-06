"use client";

import { useState } from "react";

interface ClubModeratorRequestCardProps {
  requestId: string;
  username: string;
  clubName: string;
  discord: string;
  motivation: string;
  createdAt: string;
}

export function ClubModeratorRequestCard({ requestId, username, clubName, discord, motivation, createdAt }: ClubModeratorRequestCardProps) {
  const [status, setStatus] = useState<string | null>(null);

  async function handle(action: "approve" | "reject") {
    setStatus("Procesando...");
    try {
      const response = await fetch("/api/panel/club-moderator-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error ?? "Error inesperado");
      }
      setStatus(action === "approve" ? "Aprobada" : "Rechazada");
    } catch (error) {
      setStatus((error as Error).message);
    }
  }

  return (
    <article className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5">
      <div>
        <p className="text-base font-semibold text-white">@{username}</p>
        <p className="text-xs text-white/60">Solicita moderar {clubName}</p>
        <p className="text-[11px] text-white/50">Enviada el {new Date(createdAt).toLocaleDateString()}</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-sm text-white/80">
        <p className="text-[11px] uppercase tracking-[0.3em] text-white/50">Discord</p>
        <p className="mt-1 font-mono text-sm">{discord}</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-sm text-white/80">
        <p className="text-[11px] uppercase tracking-[0.3em] text-white/50">Motivación</p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{motivation}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => handle("approve")}
          className="rounded-full bg-emerald-500 px-4 py-1 text-xs font-semibold text-white transition hover:bg-emerald-400"
        >
          Aprobar
        </button>
        <button
          onClick={() => handle("reject")}
          className="rounded-full bg-rose-500 px-4 py-1 text-xs font-semibold text-white transition hover:bg-rose-400"
        >
          Rechazar
        </button>
        {status && <span className="text-[11px] text-white/70">{status}</span>}
      </div>
    </article>
  );
}
