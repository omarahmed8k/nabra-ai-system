"use client";

import { useState, useEffect } from "react";
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

      toast.success("User updated successfully");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to update user");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User Profile</DialogTitle>
          <DialogDescription>
            Update user's name and email address. Changes will affect their login credentials.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">
              <User className="inline h-4 w-4 mr-1" />
              Full Name
            </Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter user's name"
              minLength={2}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">
              <Mail className="inline h-4 w-4 mr-1" />
              Email Address
            </Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
            />
            <p className="text-xs text-muted-foreground">
              This will update their login credentials
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateUser.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateUser.isPending}>
              {updateUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
