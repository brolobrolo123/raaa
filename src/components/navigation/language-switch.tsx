"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocale } from "@/actions/set-locale";
import { useLocale, useTranslations } from "@/lib/i18n/client";

export function LanguageSwitch() {
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [isMobile, setIsMobile] = useState(false);
  const nextLocale = locale === "es" ? "en" : "es";

  useEffect(() => {
    const query = window.matchMedia("(max-width: 640px)");
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches);
    };

    handleChange(query);
    const listener = (event: MediaQueryListEvent) => handleChange(event);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);

  const desktopLabel = locale === "es" ? "Change to English" : "Ver en Español";
  const mobileLabel = locale === "es" ? "Español" : "English";
  const label = isMobile ? mobileLabel : desktopLabel;

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
      className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-white transition hover:border-white/40 hover:bg-white/10 disabled:opacity-60 sm:gap-1.5 sm:px-4 sm:py-2 sm:text-sm"
    >
      <span className="text-[10px] uppercase tracking-[0.3em] text-white/60 sm:text-[11px]">{t("footer.language.label")}</span>
      <span className="font-semibold">{label}</span>
    </button>
  );
}
