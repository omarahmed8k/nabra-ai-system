"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { Loader2, User, Mail, Upload, X } from "lucide-react";

export function EditProfileForm() {
  const t = useTranslations("profile.editProfile");
  const { data: profile, isLoading, refetch } = trpc.user.getProfile.useQuery();
  const updateProfile = trpc.user.updateProfile.useMutation();
  const { update: updateSession } = useSession();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [image, setImage] = useState("");
  const [countryCode, setCountryCode] = useState("+20");
  const [phone, setPhone] = useState("");
  const [hasWhatsapp, setHasWhatsapp] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!phone) {
      setHasWhatsapp(false);
    }
  }, [phone]);

  // Set form values when profile loads
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setEmail(profile.email);
      setImage(profile.image || "");
      if (profile.phone) {
        const parts = profile.phone.split(" ");
        if (parts.length > 1 && parts[0].startsWith("+")) {
          setCountryCode(parts[0]);
          setPhone(parts.slice(1).join(" "));
        } else {
          setPhone(profile.phone);
        }
      } else {
        setPhone("");
        setCountryCode("+20");
      }
      setHasWhatsapp(profile.hasWhatsapp ?? false);
    }
  }, [profile]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error(t("uploadMessages.invalidType"));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("uploadMessages.tooLarge"));
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(t("uploadMessages.uploadFailed"));
      }

      const data = await response.json();
      setImage(data.url);
      toast.success(t("uploadMessages.success"));
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(t("uploadMessages.failed"));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const updates: {
        name?: string;
        email?: string;
        image?: string | null;
        phone?: string;
        hasWhatsapp?: boolean;
      } = {};

      if (name === profile?.name) {
        /* no change */
      } else {
        updates.name = name;
      }

      if (email === profile?.email) {
        /* no change */
      } else {
        updates.email = email;
      }

      if (image === profile?.image) {
        /* no change */
      } else {
        updates.image = image || null;
      }

      const composedPhone = phone ? `${countryCode} ${phone}` : undefined;
      if (composedPhone !== profile?.phone) {
        updates.phone = composedPhone;
      }

      if (hasWhatsapp !== profile?.hasWhatsapp) {
        updates.hasWhatsapp = hasWhatsapp;
      }

      const result = await updateProfile.mutateAsync(updates);

      toast.success(result.message);

      // Update NextAuth session with new data
      await updateSession({
        ...result.user,
      });

      refetch();
    } catch (error: any) {
      toast.error(error.message || t("errorMessage"));
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-1">
              <User className="inline h-4 w-4" />
              {t("labels.name")}
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("placeholders.name")}
              minLength={2}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-1">
              <Mail className="inline h-4 w-4" />
              {t("labels.email")}
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("placeholders.email")}
              required
            />
            <p className="text-xs text-muted-foreground">{t("helperText.emailWarning")}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t("labels.phone")}</Label>
            <div className="flex rtl:flex-row-reverse gap-2">
              <Select value={countryCode} onValueChange={setCountryCode}>
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
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("placeholders.phone")}
                className="flex-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="hasWhatsapp"
                checked={hasWhatsapp}
                onCheckedChange={(checked) => setHasWhatsapp(checked === true)}
                disabled={!phone}
              />
              <Label htmlFor="hasWhatsapp" className={`text-sm ${!phone ? "opacity-50" : ""}`}>
                {t("labels.hasWhatsapp")}
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">{t("helperText.phone")}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image" className="flex items-center gap-1">
              <Upload className="inline h-4 w-4" />
              {t("labels.profileImage")}
            </Label>
            <div className="flex flex-col gap-3">
              {image ? (
                <div className="flex items-center gap-4">
                  <img
                    src={image}
                    alt="Profile preview"
                    className="h-20 w-20 rounded-full object-cover border-2 border-border"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-2">
                      {t("helperText.currentPhoto")}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setImage("")}
                      disabled={uploading}
                      className="flex items-center gap-1"
                    >
                      <X className="h-4 w-4" />
                      {t("buttons.removePhoto")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("image-upload")?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("buttons.uploading")}
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        {t("buttons.uploadPhoto")}
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">{t("helperText.maxFileSize")}</p>
                </div>
              )}
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setName(profile?.name || "");
                setEmail(profile?.email || "");
                setImage(profile?.image || "");
                if (profile?.phone) {
                  const parts = profile.phone.split(" ");
                  if (parts.length > 1 && parts[0].startsWith("+")) {
                    setCountryCode(parts[0]);
                    setPhone(parts.slice(1).join(" "));
                  } else {
                    setPhone(profile.phone);
                  }
                } else {
                  setPhone("");
                  setCountryCode("+20");
                }
                setHasWhatsapp(profile?.hasWhatsapp ?? false);
              }}
            >
              {t("buttons.reset")}
            </Button>
            <Button
              type="submit"
              disabled={updateProfile.isPending}
              className="flex items-center gap-2"
            >
              {updateProfile.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("buttons.saveChanges")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
