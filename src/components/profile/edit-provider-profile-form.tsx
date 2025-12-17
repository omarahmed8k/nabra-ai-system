"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { Loader2, Briefcase, Link as LinkIcon, Award } from "lucide-react";

export function EditProviderProfileForm() {
  const t = useTranslations("provider.profile.providerInfo");
  const { data: profile, isLoading, refetch } = trpc.user.getProfile.useQuery();
  const updateProviderProfile = trpc.user.updateProviderProfile.useMutation();

  const [bio, setBio] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [skills, setSkills] = useState("");

  useEffect(() => {
    if (profile?.providerProfile) {
      setBio(profile.providerProfile.bio || "");
      setPortfolio(profile.providerProfile.portfolio || "");
      setSkills(profile.providerProfile.skillsTags?.join(", ") || "");
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const updates: {
        bio?: string;
        portfolio?: string | null;
        skillsTags?: string[];
      } = {};

      if (bio !== profile?.providerProfile?.bio) updates.bio = bio;
      if (portfolio !== profile?.providerProfile?.portfolio) updates.portfolio = portfolio || null;
      if (skills !== profile?.providerProfile?.skillsTags?.join(", ")) {
        updates.skillsTags = skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      const result = await updateProviderProfile.mutateAsync(updates);

      toast.success(result.message);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to update provider profile");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!profile?.providerProfile) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {t("notAvailable")}
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
            <Label htmlFor="bio">
              <Briefcase className="inline h-4 w-4 mr-1" />
              {t("bio")}
            </Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t("bioPlaceholder")}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {t("bioCharacters", { count: bio.length })}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="portfolio">
              <LinkIcon className="inline h-4 w-4 mr-1" />
              {t("portfolio")}
            </Label>
            <Input
              id="portfolio"
              type="url"
              value={portfolio}
              onChange={(e) => setPortfolio(e.target.value)}
              placeholder={t("portfolioPlaceholder")}
            />
            <p className="text-xs text-muted-foreground">{t("portfolioHint")}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills">
              <Award className="inline h-4 w-4 mr-1" />
              {t("skills")}
            </Label>
            <Textarea
              id="skills"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder={t("skillsPlaceholder")}
              rows={3}
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground">
              {t("skillsHint", { count: skills.length })}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setBio(profile?.providerProfile?.bio || "");
                setPortfolio(profile?.providerProfile?.portfolio || "");
                setSkills(profile?.providerProfile?.skillsTags?.join(", ") || "");
              }}
            >
              {t("reset")}
            </Button>
            <Button type="submit" disabled={updateProviderProfile.isPending}>
              {updateProviderProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("saveChanges")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
