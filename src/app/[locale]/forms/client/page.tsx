"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ClientFormPage() {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const getText = (key: string) => {
      const v = formData.get(key);
      return typeof v === "string" ? v.trim() : "";
    };
    const payload = {
      type: "client",
      fullName: getText("fullName"),
      email: getText("email"),
      phone: getText("phone"),
      company: getText("company"),
      website: getText("website"),
      message: getText("message"),
    };

    try {
      const res = await fetch("/api/forms/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        toast.error(t("forms.toast.errorTitle"), { description: t("forms.toast.errorDesc") });
        setLoading(false);
        return;
      }

      (e.currentTarget as HTMLFormElement).reset();
      toast.success(t("forms.toast.sentTitle"), { description: t("forms.toast.sentDesc") });
    } catch {
      toast.error(t("forms.toast.errorTitle"), { description: t("forms.toast.errorDesc") });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-14">
      <Card>
        <CardHeader>
          <CardTitle>{t("forms.client.title")}</CardTitle>
          <CardDescription>{t("forms.client.subtitle")}</CardDescription>
          <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.02] p-4 text-sm text-muted-foreground">
            <p className="text-foreground/90 font-medium">{t("forms.client.pitchTitle")}</p>
            <ul className="mt-2 list-disc ps-5 space-y-1">
              <li>{t("forms.client.pitchBullet0")}</li>
              <li>{t("forms.client.pitchBullet1")}</li>
              <li>{t("forms.client.pitchBullet2")}</li>
            </ul>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t("forms.fields.fullName")}</Label>
                <Input id="fullName" name="fullName" required minLength={2} maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("forms.fields.email")}</Label>
                <Input id="email" name="email" type="email" required maxLength={254} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("forms.fields.phone")}</Label>
                <Input id="phone" name="phone" maxLength={50} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">{t("forms.fields.company")}</Label>
                <Input id="company" name="company" maxLength={120} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="website">{t("forms.fields.website")}</Label>
                <Input id="website" name="website" maxLength={300} placeholder="https://…" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">{t("forms.fields.message")}</Label>
              <Textarea id="message" name="message" required minLength={10} maxLength={4000} />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("forms.actions.sending") : t("forms.actions.send")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
