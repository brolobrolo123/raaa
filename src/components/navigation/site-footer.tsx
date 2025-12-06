"use client";

import { useTranslations } from "@/lib/i18n/client";

export function SiteFooter() {
  const t = useTranslations();
  return (
    <footer className="mt-16 flex flex-col items-center gap-4 border-t border-white/10 px-6 py-8 text-center text-sm text-white/70 sm:flex-row sm:justify-between">
      <p>{t("footer.tagline")}</p>
    </footer>
  );
}
