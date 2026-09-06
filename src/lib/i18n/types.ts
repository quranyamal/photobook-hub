export type Locale = "id" | "en" | "ar";

export const locales: Locale[] = ["id", "en", "ar"];
export const defaultLocale: Locale = "en";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const localeLabels: Record<Locale, string> = {
  id: "ID",
  en: "EN",
  ar: "AR",
};
