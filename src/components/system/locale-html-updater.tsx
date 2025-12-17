"use client";

import { useEffect } from "react";

export function LocaleHtmlUpdater({ locale }: { readonly locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  return null;
}
