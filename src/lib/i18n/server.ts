import { cookies } from "next/headers";
import { defaultLocale, LOCALE_COOKIE } from "./types";
import type { Locale } from "./types";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  if (value === "id" || value === "ar") return value;
  return defaultLocale;
}
