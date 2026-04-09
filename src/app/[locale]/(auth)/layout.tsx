import type { Metadata } from "next";
import { WhatsAppSupport } from "@/components/ui/whatsapp-support";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <div className="w-full max-w-md p-4">{children}</div>
      <WhatsAppSupport />
    </div>
  );
}
