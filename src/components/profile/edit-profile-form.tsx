"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { Loader2, User, Mail, Upload, X } from "lucide-react";

export function EditProfileForm() {
  const { data: profile, isLoading, refetch } = trpc.user.getProfile.useQuery();
  const updateProfile = trpc.user.updateProfile.useMutation();
  const { update: updateSession } = useSession();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [image, setImage] = useState("");
  const [uploading, setUploading] = useState(false);

  // Set form values when profile loads
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setEmail(profile.email);
      setImage(profile.image || "");
    }
  }, [profile]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
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
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setImage(data.url);
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
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

      const result = await updateProfile.mutateAsync(updates);

      toast.success(result.message);

      // Update NextAuth session with new data
      await updateSession({
        ...result.user,
      });

      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
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
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Update your account details and personal information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              <User className="inline h-4 w-4 mr-1" />
              Full Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              minLength={2}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              <Mail className="inline h-4 w-4 mr-1" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
            <p className="text-xs text-muted-foreground">
              Changing your email will affect your login credentials
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">
              <Upload className="inline h-4 w-4 mr-1" />
              Profile Photo (optional)
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
                    <p className="text-sm text-muted-foreground mb-2">Current photo</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setImage("")}
                      disabled={uploading}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
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
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Photo
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">Max 5MB, JPG/PNG/GIF</p>
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
              }}
            >
              Reset
            </Button>
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
