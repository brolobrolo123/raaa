"use client";

import { useEffect, useState } from "react";
import { BACKGROUND_STORAGE_KEY, BACKGROUND_TOGGLE_EVENT } from "@/components/background-slideshow";

interface BackgroundToggleProps {
  description: string;
  enableLabel: string;
  disableLabel: string;
  enabledStatus: string;
  disabledStatus: string;
}

export function BackgroundToggle({
  description,
  enableLabel,
  disableLabel,
  enabledStatus,
  disabledStatus,
}: BackgroundToggleProps) {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const stored = window.localStorage.getItem(BACKGROUND_STORAGE_KEY);
    if (stored !== null) {
      setEnabled(stored === "1");
    }

    const handleToggleEvent = (event: Event) => {
      if (event instanceof CustomEvent && typeof event.detail === "boolean") {
        setEnabled(event.detail);
      }
    };

    window.addEventListener(BACKGROUND_TOGGLE_EVENT, handleToggleEvent);
    return () => window.removeEventListener(BACKGROUND_TOGGLE_EVENT, handleToggleEvent);
  }, []);

  const toggleEnabled = () => {
    const next = !enabled;
    setEnabled(next);
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(BACKGROUND_STORAGE_KEY, next ? "1" : "0");
    window.dispatchEvent(new CustomEvent(BACKGROUND_TOGGLE_EVENT, { detail: next }));
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-300">{description}</p>
      <button
        type="button"
        onClick={toggleEnabled}
        className="w-full rounded-full border border-white/20 bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-white transition hover:border-sky-300"
      >
        {enabled ? disableLabel : enableLabel}
      </button>
      <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
        {enabled ? enabledStatus : disabledStatus}
      </p>
    </div>
  );
}
