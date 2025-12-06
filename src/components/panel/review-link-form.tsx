"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/lib/i18n/client";

function resolveArticleId(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const tryParse = (input: string) => {
    const normalized = input.replace(/\?.*$/, "");
    const segments = normalized.split("/").filter(Boolean);
    if (segments[0] === "articles" && segments[1]) {
      return segments[1];
    }
    return null;
  };

  if (typeof window !== "undefined") {
    try {
      const url = new URL(trimmed, window.location.origin);
      const fromUrl = tryParse(url.pathname);
      if (fromUrl) {
        return fromUrl;
      }
    } catch {
      // fallback to manual parsing
    }
  }

  const relative = trimmed.replace(/^https?:\/\/(www\.)?[^/]+/, "");
  return tryParse(relative) ?? tryParse(trimmed);
}

export function ReviewLinkForm() {
  const t = useTranslations();
  const router = useRouter();
  const [link, setLink] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const articleId = resolveArticleId(link);
    if (!articleId) {
      setStatus(t("common.moderationPanelReviewLinkInvalid"));
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch("/api/panel/articles/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, action: "flag" }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Error inesperado");
      }
      setStatus(t("common.moderationPanelReviewLinkSuccess"));
      setLink("");
      router.refresh();
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white">
      <p className="text-xs uppercase tracking-[0.3em] text-white/50">{t("common.moderationPanelReviewLinkLabel")}</p>
      <div className="flex gap-2">
        <input
          value={link}
          onChange={(event) => setLink(event.target.value)}
          placeholder={t("common.moderationPanelReviewLinkPlaceholder")}
          className="flex-1 rounded-full border border-white/20 bg-black/40 px-3 py-2 text-xs text-white placeholder:text-white/40"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "..." : t("common.moderationPanelReviewLinkButton")}
        </button>
      </div>
      {status && <p className="text-[11px] text-white/60">{status}</p>}
    </form>
  );
}
