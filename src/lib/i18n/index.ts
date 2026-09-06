export { type Locale, locales, defaultLocale, LOCALE_COOKIE, localeLabels } from "./types";

import { id } from "./locales/id";
import { en } from "./locales/en";
import { ar } from "./locales/ar";
import type { Locale } from "./types";

const dictionaries = { id, en, ar } as const;

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}

export type Dictionary = ReturnType<typeof getDictionary>;
