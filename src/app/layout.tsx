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
    default: "Wengz",
    template: "%s | Wengz",
  },
  description:
    "Connect with trusted creators through a credit-based subscription model for design, development, video production, and more.",
  applicationName: "Wengz",
  keywords: [
    "Wengz",
    "digital services",
    "service marketplace",
    "creative services",
    "subscription",
  ],
  openGraph: {
    title: "Wengz | Digital Services Marketplace",
    description:
      "Connect with trusted creators through a credit-based subscription model for design, development, video production, and more.",
    siteName: "Wengz",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wengz | Digital Services Marketplace",
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
    title: "Wengz",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/images/logo.svg",
    shortcut: "/images/logo.svg",
    apple: "/images/logo.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#690DD4",
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
      <body className="font-sans" suppressHydrationWarning>
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
