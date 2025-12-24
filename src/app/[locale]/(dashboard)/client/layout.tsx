"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/routing";
import { useEffect } from "react";

function getClientRedirect(role?: string | null): string | null {
  switch (role) {
    case "PROVIDER":
      return "/provider";
    case "SUPER_ADMIN":
      return "/admin";
    case "CLIENT":
      return null; // Allow access
    default:
      return role ? "/" : null; // Redirect unknown roles to home
  }
}

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/login");
      return;
    }

    const redirect = getClientRedirect(session.user?.role);
    if (redirect) {
      router.push(redirect);
    }
  }, [session, status, router]);

  const isAuthorized = !!(
    status !== "loading" &&
    session &&
    (session.user?.role === "CLIENT" || session.user?.role === "SUPER_ADMIN")
  );

  return isAuthorized ? children : null;
}
