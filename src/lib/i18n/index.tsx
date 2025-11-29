"use client";

import { createContext, useContext, type ReactNode } from "react";
import { translate as resolvePath, translations, type Dictionary, type Locale } from "./dictionaries";

export const I18nContext = createContext<{ locale: Locale; dictionary: Dictionary }>(
  {
    locale: "es",
    dictionary: translations.es,
  },
);

export function useTranslations() {
  const { dictionary } = useContext(I18nContext);
  return (path: string) => resolvePath(dictionary, path);
}

export function useLocale() {
  const { locale } = useContext(I18nContext);
  return locale;
}

export function I18nProvider({ locale, dictionary, children }: { locale: Locale; dictionary: Dictionary; children: ReactNode }) {
  return <I18nContext.Provider value={{ locale, dictionary }}>{children}</I18nContext.Provider>;
}

export type { Dictionary, Locale } from "./dictionaries";
export { translate } from "./dictionaries";
