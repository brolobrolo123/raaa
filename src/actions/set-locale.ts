'use server';

import { cookies } from "next/headers";
import type { Locale } from "@/lib/i18n/dictionaries";

const COOKIE_NAME = "lang";
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function setLocale(locale: Locale) {
  const cookieStore = await cookies();
  cookieStore.set({
    name: COOKIE_NAME,
    value: locale,
    maxAge: ONE_YEAR,
    path: "/",
  });
}
