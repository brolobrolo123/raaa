import { cookies } from "next/headers";
import { translations, type Dictionary, type Locale } from "./dictionaries";

export async function getCurrentLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get("lang")?.value;
  if (cookieValue === "en" || cookieValue === "es") {
    return cookieValue;
  }
  return "es";
}

export function getDictionary(locale: Locale): Dictionary {
  return translations[locale];
}

export { translate } from "./dictionaries";
