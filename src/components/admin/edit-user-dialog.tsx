"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { Loader2, User, Mail } from "lucide-react";

interface EditUserDialogProps {
  readonly user: {
    id: string;
    name: string | null;
    email: string;
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

  const updateUser = trpc.admin.updateUser.useMutation();

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      const updates: {
        name?: string;
        email?: string;
      } = {};

      if (name === user.name) {
        /* no change */
      } else {
        updates.name = name;
      }

      if (email === user.email) {
        /* no change */
      } else {
        updates.email = email;
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
