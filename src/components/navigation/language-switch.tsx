"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocale } from "@/actions/set-locale";
import { useLocale, useTranslations } from "@/lib/i18n/client";

export function LanguageSwitch() {
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const nextLocale = locale === "es" ? "en" : "es";

  const label = locale === "es" ? t("footer.language.switchToEnglish") : t("footer.language.switchToSpanish");

  const handleToggle = () => {
    if (pending) return;
    startTransition(() => {
      void setLocale(nextLocale).then(() => router.refresh());
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white transition hover:border-white/40 hover:bg-white/10 disabled:opacity-60"
    >
      <span className="text-xs uppercase tracking-[0.35em] text-white/60">{t("footer.language.label")}</span>
      <span className="font-semibold">{label}</span>
    </button>
  );
}
