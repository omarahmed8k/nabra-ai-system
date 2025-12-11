import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/session-provider";
import { TRPCProvider } from "@/components/providers/trpc-provider";
import { NotificationProvider } from "@/components/providers/notification-provider";
import { Toaster } from "@/components/ui/sonner";
import { ChunkReloadOnError } from "@/components/system/chunk-reloader";

// Initialize notification system on server
import "@/lib/notifications/init";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nabra AI System - Service Marketplace",
  description:
    "Connect with service providers through a credit-based subscription model. Web development, design, video production, and more.",
  icons: {
    icon: "/images/favicon.svg",
    shortcut: "/images/favicon.svg",
    apple: "/images/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <TRPCProvider>
            <NotificationProvider>
              <ChunkReloadOnError />
              {children}
              <Toaster position="top-right" richColors closeButton />
            </NotificationProvider>
          </TRPCProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
