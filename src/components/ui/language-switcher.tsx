"use client";

import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

const locales = [
  { code: "en", label: "EN", flag: "🇺🇸" },
  { code: "ar", label: "AR", flag: "🇸🇦" },
] as const;

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  // Toggle to the other language
  const targetLocale = locale === "en" ? "ar" : "en";
  const targetLanguage = locales.find((l) => l.code === targetLocale) || locales[0];

  const handleToggle = () => {
    const segments = pathname.split("/").filter(Boolean);
    const localeList = ["en", "ar"] as const;
    const isFirstSegmentLocale = localeList.includes(segments[0] as (typeof localeList)[number]);

    let pathWithoutLocale = pathname;
    if (isFirstSegmentLocale) {
      const remaining = segments.slice(1).join("/");
      pathWithoutLocale = remaining ? `/${remaining}` : "/";
    }

    const newPath = `/${targetLocale}${pathWithoutLocale === "/" ? "" : pathWithoutLocale}`;
    globalThis.location.href = newPath;
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleToggle} className="gap-2">
      <span className="text-sm">{targetLanguage.flag}</span>
      <span className="hidden sm:inline text-sm">{targetLanguage.label}</span>
    </Button>
  );
}
