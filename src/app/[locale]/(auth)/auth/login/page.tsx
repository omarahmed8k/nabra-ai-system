"use client";

import { useState, useEffect } from "react";
import { signIn, getSession, useSession } from "next-auth/react";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/routing";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("auth.login");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const isPrivate = searchParams?.get("private") === "true";

  // Redirect to home if not accessing with private param
  useEffect(() => {
    if (!isPrivate) {
      router.push(`/${locale}`);
    }
  }, [isPrivate, router, locale]);

  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // Redirect based on user role, preserving locale
      if (session.user.role === "SUPER_ADMIN") {
        router.push(`/${locale}/admin`);
      } else if (session.user.role === "PROVIDER") {
        router.push(`/${locale}/provider`);
      } else {
        router.push(`/${locale}/client`);
      }
    }
  }, [status, session, router, locale]);

  // Show loading state while checking authentication
  if (status === "loading" || !isPrivate) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render login form if already authenticated
  if (status === "authenticated") {
    return null;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(t("loginFailed"), {
          description: t("invalidCredentials"),
        });
        setIsLoading(false);
        return;
      }

      // Get the updated session to determine user role
      const session = await getSession();

      toast.success(t("welcomeBack"), {
        description: t("successLogin"),
      });

      // Redirect based on user role with full page reload to ensure proper session initialization
      if (session?.user?.role === "SUPER_ADMIN") {
        globalThis.location.href = `/${locale}/admin`;
      } else if (session?.user?.role === "PROVIDER") {
        globalThis.location.href = `/${locale}/provider`;
      } else {
        globalThis.location.href = `/${locale}/client`;
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error(t("error"), {
        description: t("errorMessage"),
      });
      setIsLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Link href="/" className="flex items-center space-x-2">
              <motion.div whileHover={{ scale: 1.1 }}>
                <Image
                  src="/images/favicon.svg"
                  alt="Nabra"
                  width={48}
                  height={48}
                  className="w-12 h-12"
                />
              </motion.div>
            </Link>
          </div>
          <CardTitle className="text-2xl text-center">{t("title")}</CardTitle>
          <CardDescription className="text-center">{t("description")}</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("emailLabel")} *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("passwordLabel")} *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <motion.div className="w-full" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t("signingIn") : t("signInButton")}
              </Button>
            </motion.div>
            <p className="text-sm text-muted-foreground text-center">
              {t("noAccount")}{" "}
              <Link href="/auth/register?private=true" className="text-primary hover:underline">
                {t("signUp")}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}
