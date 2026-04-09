import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import type { Metadata } from "next";

import { routing } from "@/i18n/routing";
import { LocaleHtmlUpdater } from "@/components/system/locale-html-updater";
import { Toaster } from "@/components/ui/sonner";
import { NotificationProvider } from "@/components/providers/notification-provider";
import { PWAInstallPrompt } from "@/components/ui/pwa-install-prompt";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isArabic = locale === "ar";
  const brand = isArabic ? "نبراوي" : "Nabarawy";
  const description = isArabic
    ? "منصة خدمات رقمية تربطك بمبدعين محترفين عبر اشتراك قائم على الكريدت."
    : "A digital services marketplace that connects you with trusted creators through a credit-based subscription model.";

  return {
    title: {
      default: brand,
      template: `%s | ${brand}`,
    },
    description,
    alternates: {
      canonical: isArabic ? "/ar" : "/",
      languages: {
        en: "/",
        ar: "/ar",
      },
    },
    openGraph: {
      title: brand,
      description,
      locale: isArabic ? "ar_SA" : "en_US",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
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
