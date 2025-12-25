import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";

import { routing } from "@/i18n/routing";
import { LocaleHtmlUpdater } from "@/components/system/locale-html-updater";
import { Toaster } from "@/components/ui/sonner";
import { NotificationProvider } from "@/components/providers/notification-provider";
import { PWAInstallPrompt } from "@/components/ui/pwa-install-prompt";

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = (await import(`../../../messages/${locale}.json`)).default;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <LocaleHtmlUpdater locale={locale} />
      <NotificationProvider>
        <div dir={locale === "ar" ? "rtl" : "ltr"}>{children}</div>
        <Toaster position="top-right" richColors closeButton />
        <PWAInstallPrompt />
      </NotificationProvider>
    </NextIntlClientProvider>
  );
}
