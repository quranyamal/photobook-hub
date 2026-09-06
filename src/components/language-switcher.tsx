"use client";

import { useRouter } from "next/navigation";
import { locales, localeLabels, LOCALE_COOKIE } from "@/lib/i18n/types";
import { useLocale } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/types";

export function LanguageSwitcher() {
  const current = useLocale();
  const router = useRouter();

  function switchLocale(locale: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000`;
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1">
      {locales.map((locale, i) => (
        <span key={locale} className="flex items-center">
          {i > 0 && <span className="text-border mx-0.5 select-none">|</span>}
          <button
            onClick={() => switchLocale(locale)}
            className={`text-xs font-medium transition-colors ${
              current === locale
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {localeLabels[locale]}
          </button>
        </span>
      ))}
    </div>
  );
}
