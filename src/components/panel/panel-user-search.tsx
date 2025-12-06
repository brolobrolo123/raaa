"use client";

import { FormEvent, useMemo, useState } from "react";
import { useTranslations } from "@/lib/i18n/client";
import type { Role } from "@/types/roles";
import { PanelUserControls } from "./panel-user-controls";
import { AvatarStatEditor } from "./avatar-stat-editor";

type WarningEntry = {
  id: string;
  reason: string;
  createdAt: string;
  issuer: string;
};

type BanEntry = {
  id: string;
  reason: string | null;
  startAt: string;
  endAt: string | null;
  permanent: boolean;
  issuer: string;
};

type SearchUser = {
  id: string;
  username: string;
  role: Role;
  bannedUntil: string | null;
  silencedUntil: string | null;
  permanentBan: boolean;
  avatar: {
    id: string;
    maxHp: number;
    currentHp: number;
    damage: number;
    evasion: number;
  } | null;
  warningCount: number;
  warnings: WarningEntry[];
  bans: BanEntry[];
};

type PanelUserSearchProps = {
  canEditAvatarStats?: boolean;
};

export function PanelUserSearch({ canEditAvatarStats = false }: PanelUserSearchProps) {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [lastQuery, setLastQuery] = useState("");

  const selectedUser = useMemo(() => {
    if (!results.length) {
      return null;
    }
    const match = results.find((user) => user.id === selectedId);
    return match ?? results[0];
  }, [results, selectedId]);

  async function performSearch(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      setStatus(t("common.moderationPanelSearchQueryRequired"));
      setResults([]);
      setSelectedId(null);
      setLastQuery("");
      return;
    }

    setIsSearching(true);
    setStatus(null);

    try {
      const encoded = encodeURIComponent(trimmed);
      const response = await fetch(`/api/panel/users/search?username=${encoded}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Error inesperado");
      }
      const users: SearchUser[] = payload?.users ?? [];
      if (users.length === 0) {
        setStatus(t("common.moderationPanelSearchNoResults"));
      }
      setResults(users);
      setSelectedId(users[0]?.id ?? null);
      setLastQuery(trimmed);
    } catch (error) {
      setStatus((error as Error).message);
      setResults([]);
      setSelectedId(null);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await performSearch(query);
  }

  async function refreshLastSearch() {
    if (!lastQuery) return;
    await performSearch(lastQuery);
  }

  const alertCycle = selectedUser?.warningCount ? ((selectedUser.warningCount - 1) % 3) + 1 : 0;
  const alertSummary = alertCycle === 0
    ? t("common.moderationPanelAlertNone")
    : t("common.moderationPanelAlertCycle")
        .replace("{current}", alertCycle.toString())
        .replace("{total}", selectedUser?.warningCount.toString() ?? "0");

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
      <p className="text-xs uppercase tracking-[0.3em] text-white/50">{t("common.moderationPanelUserSearchLabel")}</p>
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("common.moderationPanelSearchPlaceholder")}
          className="flex-1 rounded-full border border-white/20 bg-black/30 px-3 py-2 text-xs text-white placeholder:text-white/40"
        />
        <button
          type="submit"
          disabled={isSearching}
          className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSearching ? "..." : t("common.moderationPanelSearchButton")}
        </button>
      </form>
      {status && <p className="text-[11px] text-white/60">{status}</p>}
      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/50">{t("common.moderationPanelSearchResultsLabel")}</p>
          <div className="flex flex-wrap gap-2">
            {results.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => setSelectedId(user.id)}
                className={`rounded-full border px-3 py-1 text-[11px] transition ${
                  selectedId === user.id || (!selectedId && results[0]?.id === user.id)
                    ? "border-white/80 bg-white/10"
                    : "border-white/20 bg-black/20"
                }`}
              >
                {user.username} · {user.role}
              </button>
            ))}
          </div>
          {selectedUser && (
            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-col gap-1">
                <p className="text-base font-semibold text-white">@{selectedUser.username}</p>
                <p className="text-[11px] uppercase tracking-[0.3em] text-white/50">{selectedUser.role}</p>
                {selectedUser.permanentBan && (
                  <p className="text-[11px] text-rose-300">{t("common.moderationPanelActivePermanentBan")}</p>
                )}
                <p className="text-[11px] text-white/50">{alertSummary}</p>
              </div>
              <PanelUserControls
                userId={selectedUser.id}
                bannedUntil={selectedUser.bannedUntil}
                permanentBan={selectedUser.permanentBan}
                silencedUntil={selectedUser.silencedUntil}
                onActionSuccess={refreshLastSearch}
              />
              {canEditAvatarStats && selectedUser.avatar && (
                <AvatarStatEditor
                  userId={selectedUser.id}
                  avatarId={selectedUser.avatar.id}
                  stats={selectedUser.avatar}
                  onUpdated={refreshLastSearch}
                />
              )}
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-white/50">
                    {t("common.moderationPanelWarningHistoryLabel")}
                  </p>
                  {selectedUser.warnings.length === 0 ? (
                    <p className="text-[11px] text-white/50">{t("common.moderationPanelWarningHistoryEmpty")}</p>
                  ) : (
                    <div className="space-y-2 pt-2">
                      {selectedUser.warnings.map((warning) => (
                        <div key={warning.id} className="space-y-1 rounded-2xl border border-white/10 bg-white/5 p-3">
                          <p className="text-[11px] text-white/50">
                            {new Date(warning.createdAt).toLocaleString()} · {warning.issuer}
                          </p>
                          <p className="text-sm text-white/80">{warning.reason}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-white/50">
                    {t("common.moderationPanelBanHistoryLabel")}
                  </p>
                  {selectedUser.bans.length === 0 ? (
                    <p className="text-[11px] text-white/50">{t("common.moderationPanelBanHistoryEmpty")}</p>
                  ) : (
                    <div className="space-y-2 pt-2">
                      {selectedUser.bans.map((ban) => (
                        <div key={ban.id} className="space-y-1 rounded-2xl border border-white/10 bg-white/5 p-3">
                          <p className="text-[11px] text-white/50">
                            {new Date(ban.startAt).toLocaleString()} - {ban.endAt ? new Date(ban.endAt).toLocaleString() : t("common.moderationPanelPermanentLabel")} · {ban.issuer}
                          </p>
                          <p className="text-sm text-white/80">{ban.reason ?? t("common.moderationPanelUnknownReason")}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
