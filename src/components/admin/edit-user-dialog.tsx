"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc/client";
import { emailSchema, phoneNumberOnlySchema } from "@/lib/validations";
import { toast } from "sonner";
import { Loader2, User, Mail } from "lucide-react";

interface EditUserDialogProps {
  readonly user: {
    id: string;
    name: string | null;
    email: string;
    phone?: string | null;
    hasWhatsapp?: boolean | null;
  } | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSuccess?: () => void;
}

export function EditUserDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: Readonly<EditUserDialogProps>) {
  const t = useTranslations("admin.users");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+20");
  const [phone, setPhone] = useState("");
  const [hasWhatsapp, setHasWhatsapp] = useState(false);

  const updateUser = trpc.admin.updateUser.useMutation();

  useEffect(() => {
    if (!user) return;
    setName(user.name || "");
    setEmail(user.email);

    const rawPhone = (user as any).phone as string | undefined | null;
    if (rawPhone) {
      const parts = rawPhone.split(" ");
      if (parts.length > 1 && parts[0].startsWith("+")) {
        setCountryCode(parts[0]);
        setPhone(parts.slice(1).join(" "));
      } else {
        setPhone(rawPhone);
      }
    } else {
      setPhone("");
      setCountryCode("+20");
    }

    setHasWhatsapp(Boolean((user as any).hasWhatsapp));
  }, [user]);

  useEffect(() => {
    if (phone) return;
    setHasWhatsapp(false);
  }, [phone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      const updates: {
        name?: string;
        email?: string;
        phone?: string;
        hasWhatsapp?: boolean;
      } = {};

      if (name === user.name) {
        /* no change */
      } else {
        updates.name = name;
      }

      // Validate email if changed
      if (email !== user.email) {
        const emailValidation = emailSchema.safeParse(email);
        if (!emailValidation.success) {
          toast.error(
            emailValidation.error.errors[0]?.message ||
              t("dialog.validation.invalidEmail") ||
              "Invalid email"
          );
          return;
        }
        updates.email = email.toLowerCase().trim();
      }

      // Validate phone if provided
      let composedPhone: string | undefined = undefined;
      if (phone) {
        const phoneValidation = phoneNumberOnlySchema.safeParse(phone);
        if (!phoneValidation.success) {
          toast.error(
            phoneValidation.error.errors[0]?.message ||
              t("dialog.validation.invalidPhone") ||
              "Invalid phone"
          );
          return;
        }
        composedPhone = `${countryCode} ${phone}`;
      }
      // Only update phone when a valid phone is provided
      if (composedPhone && composedPhone !== (user as any).phone) {
        updates.phone = composedPhone;
      }

      if (hasWhatsapp !== (user as any).hasWhatsapp) {
        updates.hasWhatsapp = hasWhatsapp;
      }

      await updateUser.mutateAsync({
        userId: user.id,
        ...updates,
      });

      toast.success(t("dialog.toast.updated"));
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || t("dialog.toast.error"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("dialog.edit.title")}</DialogTitle>
          <DialogDescription>{t("dialog.edit.description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name" className="flex items-center gap-1">
              <User className="inline h-4 w-4" />
              {t("dialog.fields.name")}
            </Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("dialog.fields.name")}
              minLength={2}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email" className="flex items-center gap-1">
              <Mail className="inline h-4 w-4" />
              {t("dialog.fields.email")}
            </Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("dialog.fields.email")}
              required
            />
            <p className="text-xs text-muted-foreground">{t("dialog.edit.description")}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-phone">{t("dialog.fields.phone")}</Label>
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
                id="edit-phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  const value = e.target.value.replaceAll(/\D/g, "");
                  setPhone(value);
                }}
                pattern="\d{7,15}"
                title="Phone number must be 7-15 digits"
                placeholder="123456789"
                className="flex-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-hasWhatsapp"
                checked={hasWhatsapp}
                onCheckedChange={(checked) => setHasWhatsapp(checked === true)}
                disabled={!phone}
              />
              <label
                htmlFor="edit-hasWhatsapp"
                className={`text-sm font-medium leading-none ${
                  phone
                    ? "peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    : "cursor-not-allowed opacity-50"
                }`}
              >
                {t("dialog.fields.hasWhatsapp")}
              </label>
            </div>
          </div>

          <DialogFooter>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateUser.isPending}
              >
                {t("dialog.buttons.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={updateUser.isPending}
                className="flex items-center gap-2"
              >
                {updateUser.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("dialog.buttons.update")}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
