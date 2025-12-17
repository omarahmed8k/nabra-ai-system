"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

const locales = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
] as const;

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  // Toggle to the other language
  const targetLocale = locale === "en" ? "ar" : "en";
  const targetLanguage = locales.find((l) => l.code === targetLocale) || locales[0];

  const handleToggle = () => {
    router.replace(pathname, { locale: targetLocale });
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleToggle} className="gap-2">
      <span className="text-sm">{targetLanguage.flag}</span>
      <span className="hidden sm:inline text-sm">{targetLanguage.label}</span>
    </Button>
  );
}
