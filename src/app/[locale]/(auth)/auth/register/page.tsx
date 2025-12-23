"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { toast } from "sonner";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc/client";

export default function RegisterPage() {
  const router = useRouter();
  const locale = useLocale();
  const { data: session, status } = useSession();
  const [error, setError] = useState("");
  const t = useTranslations("auth.register");

  // All hooks must be called before any conditional returns
  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success(t("accountCreated"), {
        description: t("successMessage"),
      });
      router.push(`/${locale}/auth/login?registered=true`);
    },
    onError: (err) => {
      setError(err.message);
      toast.error(t("registrationFailed"), {
        description: err.message,
      });
    },
  });

  const [countryCode, setCountryCode] = useState("+20");
  const [phoneInput, setPhoneInput] = useState("");
  const [hasWhatsapp, setHasWhatsapp] = useState(false);

  useEffect(() => {
    if (!phoneInput) {
      setHasWhatsapp(false);
    }
  }, [phoneInput]);

  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // Redirect based on user role
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
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render register form if already authenticated
  if (status === "authenticated") {
    return null;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const phoneRaw = (formData.get("phone") as string) || "";

    const phone = phoneRaw ? `${countryCode} ${phoneRaw}` : undefined;

    if (password !== confirmPassword) {
      setError(t("passwordsNotMatch"));
      toast.error(t("validationError"), {
        description: t("passwordsNotMatch"),
      });
      return;
    }

    registerMutation.mutate({ name, email, password, phone, hasWhatsapp });
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
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">{t("nameLabel")} *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder={t("namePlaceholder")}
                required
                minLength={2}
                maxLength={100}
                disabled={registerMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">{t("nameHint")}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("emailLabel")} *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                required
                disabled={registerMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">{t("emailHint")}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t("phoneLabel")}</Label>
              <div className="flex rtl:flex-row-reverse gap-2">
                <Select
                  value={countryCode}
                  onValueChange={setCountryCode}
                  disabled={registerMutation.isPending}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+20">🇪🇬 +20</SelectItem>
                    <SelectItem value="+966">🇸🇦 +966</SelectItem>
                    <SelectItem value="+971">🇦🇪 +971</SelectItem>
                    <SelectItem value="+965">🇰🇼 +965</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder={t("phonePlaceholder")}
                  disabled={registerMutation.isPending}
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="hasWhatsapp"
                  checked={hasWhatsapp}
                  onCheckedChange={(checked) => setHasWhatsapp(checked === true)}
                  disabled={!phoneInput || registerMutation.isPending}
                />
                <Label
                  htmlFor="hasWhatsapp"
                  className={`text-sm ${!phoneInput ? "opacity-50" : ""}`}
                >
                  {t("hasWhatsappLabel")}
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">{t("phoneHint")}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("passwordLabel")} *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                maxLength={100}
                disabled={registerMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("confirmPasswordLabel")} *</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={6}
                maxLength={100}
                disabled={registerMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">{t("confirmPasswordHint")}</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <motion.div className="w-full" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? t("creatingAccount") : t("createAccountButton")}
              </Button>
            </motion.div>
            <p className="text-sm text-muted-foreground text-center">
              {t("haveAccount")}{" "}
              <Link href="/auth/login" className="text-primary hover:underline">
                {t("signInLink")}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}
