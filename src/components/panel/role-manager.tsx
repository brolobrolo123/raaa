"use client";

import { useState } from "react";
import type { Role } from "@/types/roles";

const ROLE_OPTIONS: Role[] = ["USER", "MODERATOR", "ADMIN"];

type RoleManagerProps = {
  entries: { id: string; username: string; role: Role }[];
  currentOwnerId: string;
};

export function RoleManager({ entries, currentOwnerId }: RoleManagerProps) {
  const [statuses, setStatuses] = useState<Record<string, string>>(() => {
    return entries.reduce<Record<string, string>>((acc, item) => {
      acc[item.id] = item.role;
      return acc;
    }, {});
  });

  async function changeRole(userId: string, role: Role) {
    setStatuses((prev) => ({ ...prev, [userId]: "Guardando..." }));
    try {
      const response = await fetch("/api/panel/users/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error ?? "Error inesperado");
      }
      setStatuses((prev) => ({ ...prev, [userId]: role }));
    } catch (error) {
      setStatuses((prev) => ({ ...prev, [userId]: (error as Error).message }));
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
      {entries.map((entry) => (
        <div key={entry.id} className="flex items-center justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-white">{entry.username}</p>
            <p className="text-[11px] text-white/60">Actual: {entry.role}</p>
          </div>
          {entry.id === currentOwnerId ? (
            <span className="text-[11px] text-white/40">Dueño</span>
          ) : (
            <select
              value={typeof statuses[entry.id] === "string" ? statuses[entry.id] : entry.role}
              onChange={(event) => changeRole(entry.id, event.target.value as Role)}
              className="rounded-full border border-white/20 bg-black/30 px-3 py-1 text-xs text-white"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
        </div>
      ))}
    </div>
  );
}
