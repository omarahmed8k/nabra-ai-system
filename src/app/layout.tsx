import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/session-provider";
import { TRPCProvider } from "@/components/providers/trpc-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nabra AI System - SaaS Project Management Platform",
  description:
    "Connect with service providers through a credit-based subscription model. Web development, design, video production, and more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <TRPCProvider>
            {children}
            <Toaster position="top-right" richColors closeButton />
          </TRPCProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
