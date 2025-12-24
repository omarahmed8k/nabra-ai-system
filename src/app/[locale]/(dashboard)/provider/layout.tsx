"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/routing";
import { useEffect } from "react";

export default function ProviderLayout({
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

    if (session.user?.role !== "PROVIDER" && session.user?.role !== "SUPER_ADMIN") {
      // Redirect to user's own role base path
      if (session.user?.role === "CLIENT") {
        router.push("/client");
      } else if (session.user?.role === "SUPER_ADMIN") {
        router.push("/admin");
      } else {
        router.push("/");
      }
      return;
    }
  }, [session, status, router]);

  if (
    status === "loading" ||
    !session ||
    (session.user?.role !== "PROVIDER" && session.user?.role !== "SUPER_ADMIN")
  ) {
    return null;
  }

  return children;
}
