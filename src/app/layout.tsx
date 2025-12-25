import type { Metadata, Viewport } from "next";
import { Lato, Cairo } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/session-provider";
import { TRPCProvider } from "@/components/providers/trpc-provider";

// Initialize notification system on server
import "@/lib/notifications/init";

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
  title: "Nabra AI System - Service Marketplace",
  description:
    "Connect with service providers through a credit-based subscription model. Web development, design, video production, and more.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nabra AI System",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/images/favicon.svg",
    shortcut: "/images/favicon.svg",
    apple: "/images/favicon.svg",
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
    <html lang="en" className={`${lato.variable} ${cairo.variable}`}>
      <body className="font-sans">
        <AuthProvider>
          <TRPCProvider>
            {/* <ChunkReloadOnError /> */}
            {children}
          </TRPCProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
