import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { ReactNode } from "react";

import { routing } from "@/i18n/routing";
import { LocaleHtmlUpdater } from "@/components/system/locale-html-updater";
import { Toaster } from "@/components/ui/sonner";
import { NotificationProvider } from "@/components/providers/notification-provider";

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

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <LocaleHtmlUpdater locale={locale} />
      <NotificationProvider>
        <div dir={locale === "ar" ? "rtl" : "ltr"}>{children}</div>
        <Toaster position="top-right" richColors closeButton />
      </NotificationProvider>
    </NextIntlClientProvider>
  );
}
