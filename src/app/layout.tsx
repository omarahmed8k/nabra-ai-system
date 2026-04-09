import type { Metadata, Viewport } from "next";
import { Lato, Cairo } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/session-provider";
import { TRPCProvider } from "@/components/providers/trpc-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

// Initialize notification system on server
import "@/lib/notifications/init";

const metadataBase = process.env.NEXT_PUBLIC_APP_URL?.startsWith("http")
  ? new URL(process.env.NEXT_PUBLIC_APP_URL)
  : new URL("https://nabarawy.tech");

const lato = Lato({
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
  variable: "--font-lato",
});

const cairo = Cairo({
  weight: ["300", "400", "600", "700", "900"],
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "Nabarawy | Digital Services Marketplace",
    template: "%s | Nabarawy",
  },
  description:
    "Connect with trusted creators through a credit-based subscription model for design, development, video production, and more.",
  applicationName: "Nabarawy",
  keywords: [
    "Nabarawy",
    "digital services",
    "service marketplace",
    "creative services",
    "subscription",
  ],
  openGraph: {
    title: "Nabarawy | Digital Services Marketplace",
    description:
      "Connect with trusted creators through a credit-based subscription model for design, development, video production, and more.",
    siteName: "Nabarawy",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nabarawy | Digital Services Marketplace",
    description:
      "Connect with trusted creators through a credit-based subscription model for design, development, video production, and more.",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nabarawy",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/images/logo.png",
    shortcut: "/images/logo.png",
    apple: "/images/logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${lato.variable} ${cairo.variable}`} suppressHydrationWarning>
      <head>
        <script>{`try{var t=localStorage.getItem('theme');document.documentElement.classList.add(t==='light'?'light':'dark')}catch(e){}`}</script>
      </head>
      <body className="font-sans">
        <ThemeProvider>
          <AuthProvider>
            <TRPCProvider>
              {/* <ChunkReloadOnError /> */}
              {children}
            </TRPCProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
