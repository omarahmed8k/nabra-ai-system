import type { Metadata } from "next";
import LandingPage from "@/components/landing/landing-page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isArabic = locale === "ar";

  return {
    title: isArabic ? "نبراوي | منصة الخدمات الرقمية" : "Nabarawy | Digital Services Marketplace",
    description: isArabic
      ? "احصل على خدمات تصميم وتطوير وإنتاج محتوى عبر مبدعين موثوقين وباشتراك مرن قائم على الكريدت."
      : "Get design, development, and content services from trusted creators with flexible credit-based subscriptions.",
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function HomePage() {
  return <LandingPage />;
}
