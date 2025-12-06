"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Role } from "@/types/roles";

const ASSIGNABLE_ROLES: Role[] = ["USER", "MODERATOR", "ADMIN"];

type SearchUser = {
  id: string;
  username: string;
  role: Role;
};

type RoleAssignmentSearchProps = {
  label: string;
  placeholder: string;
  searchButtonLabel: string;
  resultsLabel: string;
  assignButtonLabel: string;
  ownerHint: string;
  queryRequiredMessage: string;
  noResultsMessage: string;
  assignSuccessMessage: string;
};

export function RoleAssignmentSearch({
  label,
  placeholder,
  searchButtonLabel,
  resultsLabel,
  assignButtonLabel,
  ownerHint,
  queryRequiredMessage,
  noResultsMessage,
  assignSuccessMessage,
}: RoleAssignmentSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [chosenRole, setChosenRole] = useState<Role>(ASSIGNABLE_ROLES[0]);
  const [isSaving, setIsSaving] = useState(false);

  const selectedUser = useMemo(() => {
    if (!results.length) {
      return null;
    }
    const match = results.find((user) => user.id === selectedId);
    return match ?? results[0];
  }, [results, selectedId]);

  useEffect(() => {
    if (selectedUser) {
      setChosenRole(selectedUser.role);
    }
  }, [selectedUser]);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim()) {
      setStatus(queryRequiredMessage);
      setResults([]);
      return;
    }
    setIsSearching(true);
    setStatus(null);

    try {
      const encoded = encodeURIComponent(query.trim());
      const response = await fetch(`/api/panel/users/search?username=${encoded}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Error inesperado");
      }
      const users: SearchUser[] = payload?.users ?? [];
      if (!users.length) {
        setStatus(noResultsMessage);
      }
      setResults(users);
      setSelectedId(users[0]?.id ?? null);
    } catch (error) {
      setStatus((error as Error).message);
      setResults([]);
      setSelectedId(null);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleAssign() {
    if (!selectedUser) {
      return;
    }
    if (selectedUser.role === "OWNER") {
      setStatus(ownerHint);
      return;
    }
    setIsSaving(true);
    setStatus(null);
    try {
      const response = await fetch("/api/panel/users/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser.id, role: chosenRole }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Error inesperado");
      }
      setStatus(assignSuccessMessage);
      setResults((prev) =>
        prev.map((user) => (user.id === selectedUser.id ? { ...user, role: chosenRole } : user))
      );
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
      <p className="text-xs uppercase tracking-[0.3em] text-white/50">{label}</p>
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-full border border-white/20 bg-black/30 px-3 py-2 text-xs text-white placeholder:text-white/40"
        />
        <button
          type="submit"
          disabled={isSearching}
          className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSearching ? "..." : searchButtonLabel}
        </button>
      </form>
      {status && <p className="text-[11px] text-white/60">{status}</p>}
      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/50">{resultsLabel}</p>
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
          {selectedUser && selectedUser.role !== "OWNER" && (
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={chosenRole}
                onChange={(event) => setChosenRole(event.target.value as Role)}
                className="rounded-full border border-white/20 bg-black/30 px-3 py-1 text-xs text-white"
              >
                {ASSIGNABLE_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAssign}
                disabled={isSaving}
                className="rounded-full bg-emerald-500 px-4 py-1 text-xs font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "..." : assignButtonLabel}
              </button>
            </div>
          )}
          {selectedUser && selectedUser.role === "OWNER" && (
            <p className="text-[11px] text-white/50">{ownerHint}</p>
          )}
        </div>
      )}
    </div>
  );
}
