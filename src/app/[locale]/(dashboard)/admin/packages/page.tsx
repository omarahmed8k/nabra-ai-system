"use client";

import { useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc/client";
import { formatCurrency } from "@/lib/utils";
import { Plus, Edit, Trash, Package, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { showError } from "@/lib/error-handler";
import { LocalizedInput } from "@/components/ui/localized-input";

export default function AdminPackagesPage() {
  const t = useTranslations("admin.packages");
  const locale = useLocale();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"active" | "deleted">("active");
  // Localized inputs state
  const [createNameI18n, setCreateNameI18n] = useState<{ en: string; ar: string }>({
    en: "",
    ar: "",
  });
  const [createDescI18n, setCreateDescI18n] = useState<{ en: string; ar: string }>({
    en: "",
    ar: "",
  });
  const [editNameI18n, setEditNameI18n] = useState<{ en: string; ar: string }>({ en: "", ar: "" });
  const [editDescI18n, setEditDescI18n] = useState<{ en: string; ar: string }>({ en: "", ar: "" });

  const { data: packages, isLoading } = trpc.admin.getPackages.useQuery({
    showDeleted: activeTab === "deleted",
  });
  const { data: allServices } = trpc.admin.getServiceTypes.useQuery();
  const utils = trpc.useUtils();

  const createPackage = trpc.admin.createPackage.useMutation({
    onSuccess: () => {
      utils.admin.getPackages.invalidate();
      setShowCreate(false);
      setSelectedServiceIds([]);
      toast.success(t("toast.created"));
    },
    onError: (error) => {
      showError(error, t("toast.createFailed"));
    },
  });

  const updatePackage = trpc.admin.updatePackage.useMutation({
    onSuccess: () => {
      utils.admin.getPackages.invalidate();
      setEditingId(null);
      setSelectedServiceIds([]);
      toast.success(t("toast.updated"));
    },
    onError: (error) => {
      showError(error, t("toast.updateFailed"));
    },
  });

  const deletePackage = trpc.admin.deletePackage.useMutation({
    onSuccess: () => {
      utils.admin.getPackages.invalidate();
      toast.success(t("toast.deleted"));
    },
    onError: (error) => {
      showError(error, t("toast.deleteFailed"));
    },
  });

  const restorePackage = trpc.admin.restorePackage.useMutation({
    onSuccess: () => {
      utils.admin.getPackages.invalidate();
      toast.success(t("toast.restored"));
    },
    onError: (error) => {
      showError(error, t("toast.restoreFailed"));
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nameEn = (formData.get("name_en") as string) || "";
    const nameAr = (formData.get("name_ar") as string) || "";
    const descEn = (formData.get("description_en") as string) || "";
    const descAr = (formData.get("description_ar") as string) || "";
    const featuresEn = ((formData.get("features_en") as string) || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const featuresAr = ((formData.get("features_ar") as string) || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const nameI18n: Record<string, string> = {};
    if (nameEn) nameI18n.en = nameEn;
    if (nameAr) nameI18n.ar = nameAr;
    const descriptionI18n: Record<string, string> = {};
    if (descEn) descriptionI18n.en = descEn;
    if (descAr) descriptionI18n.ar = descAr;
    const featuresI18n: Record<string, string[]> = {};
    if (featuresEn.length) featuresI18n.en = featuresEn;
    if (featuresAr.length) featuresI18n.ar = featuresAr;
    createPackage.mutate({
      name: nameEn || nameAr,
      nameI18n: Object.keys(nameI18n).length ? nameI18n : undefined,
      price: Number.parseFloat(formData.get("price") as string),
      credits: Number.parseInt(formData.get("credits") as string),
      durationDays: Number.parseInt(formData.get("durationDays") as string),
      description: descEn || descAr || undefined,
      descriptionI18n: Object.keys(descriptionI18n).length ? descriptionI18n : undefined,
      features: featuresEn,
      featuresI18n: Object.keys(featuresI18n).length ? featuresI18n : undefined,
      serviceIds: selectedServiceIds,
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>, id: string) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nameEn = (formData.get("name_en") as string) || "";
    const nameAr = (formData.get("name_ar") as string) || "";
    const descEn = (formData.get("description_en") as string) || "";
    const descAr = (formData.get("description_ar") as string) || "";
    const featuresEn = ((formData.get("features_en") as string) || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const featuresAr = ((formData.get("features_ar") as string) || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const nameI18n: Record<string, string> = {};
    if (nameEn) nameI18n.en = nameEn;
    if (nameAr) nameI18n.ar = nameAr;
    const descriptionI18n: Record<string, string> = {};
    if (descEn) descriptionI18n.en = descEn;
    if (descAr) descriptionI18n.ar = descAr;
    const featuresI18n: Record<string, string[]> = {};
    if (featuresEn.length) featuresI18n.en = featuresEn;
    if (featuresAr.length) featuresI18n.ar = featuresAr;
    updatePackage.mutate({
      id,
      name: nameEn || nameAr || undefined,
      nameI18n: Object.keys(nameI18n).length ? nameI18n : undefined,
      price: Number.parseFloat(formData.get("price") as string),
      credits: Number.parseInt(formData.get("credits") as string),
      description: descEn || descAr || undefined,
      descriptionI18n: Object.keys(descriptionI18n).length ? descriptionI18n : undefined,
      features: featuresEn,
      featuresI18n: Object.keys(featuresI18n).length ? featuresI18n : undefined,
      serviceIds: selectedServiceIds,
    });
  };

  const toggleService = useCallback((serviceId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  }, []);

  const handleCancelCreate = useCallback(() => {
    setShowCreate(false);
    setSelectedServiceIds([]);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setSelectedServiceIds([]);
  }, []);

  const handleEditPackage = useCallback((pkg: any) => {
    setEditingId(pkg.id);
    setSelectedServiceIds(pkg.services?.map((s: any) => s.serviceType.id) || []);
    setEditNameI18n({
      en: (pkg as any).nameI18n?.en || pkg.name || "",
      ar: (pkg as any).nameI18n?.ar || "",
    });
    setEditDescI18n({
      en: (pkg as any).descriptionI18n?.en || (pkg as any).description || "",
      ar: (pkg as any).descriptionI18n?.ar || "",
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {t("addPackage")}
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card>
          <form onSubmit={handleCreate}>
            <CardHeader>
              <CardTitle>{t("createNewPackage")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>{t("fields.localizedName")}</Label>
                  <LocalizedInput
                    value={createNameI18n}
                    onChange={setCreateNameI18n}
                    required
                    variant="input"
                  />
                  <input type="hidden" name="name_en" value={createNameI18n.en} />
                  <input type="hidden" name="name_ar" value={createNameI18n.ar} />
                  <p className="text-xs text-muted-foreground">{t("fields.nameHint")}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">{t("fields.priceRequired")}</Label>
                  <Input id="price" name="price" type="number" step="0.01" min="0" required />
                  <p className="text-xs text-muted-foreground">{t("fields.priceHint")}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credits">{t("fields.creditsRequired")}</Label>
                  <Input id="credits" name="credits" type="number" min="1" required />
                  <p className="text-xs text-muted-foreground">{t("fields.creditsHint")}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="durationDays">{t("fields.durationRequired")}</Label>
                  <Input
                    id="durationDays"
                    name="durationDays"
                    type="number"
                    min="1"
                    defaultValue="30"
                    required
                  />
                  <p className="text-xs text-muted-foreground">{t("fields.durationHint")}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("fields.localizedDescription")}</Label>
                <LocalizedInput
                  value={createDescI18n}
                  onChange={setCreateDescI18n}
                  variant="textarea"
                />
                <input type="hidden" name="description_en" value={createDescI18n.en} />
                <input type="hidden" name="description_ar" value={createDescI18n.ar} />
              </div>

              <div className="space-y-2">
                <Label>{t("fields.localizedFeatures")}</Label>
                <Tabs defaultValue="en" className="w-full">
                  <TabsList>
                    <TabsTrigger value="en">EN</TabsTrigger>
                    <TabsTrigger value="ar">AR</TabsTrigger>
                  </TabsList>
                  <TabsContent value="en">
                    <textarea
                      id="features_en"
                      name="features_en"
                      className="w-full min-h-[100px] p-2 border rounded-md"
                      placeholder={t("fields.featuresPlaceholder")}
                      maxLength={2000}
                    />
                    <p className="text-xs text-muted-foreground">{t("fields.featuresHint")}</p>
                  </TabsContent>
                  <TabsContent value="ar">
                    <textarea
                      id="features_ar"
                      name="features_ar"
                      className="w-full min-h-[100px] p-2 border rounded-md"
                      placeholder={t("fields.featuresPlaceholder")}
                      maxLength={2000}
                    />
                  </TabsContent>
                </Tabs>
              </div>

              <div className="space-y-2">
                <Label>{t("fields.includedServices")}</Label>
                <div className="grid gap-3 md:grid-cols-2 border rounded-lg p-4">
                  {allServices?.map(
                    (service: { id: string; name: string; icon: string | null }) => (
                      <div key={service.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`service-${service.id}`}
                          checked={selectedServiceIds.includes(service.id)}
                          onCheckedChange={() => toggleService(service.id)}
                        />
                        <Label
                          htmlFor={`service-${service.id}`}
                          className="cursor-pointer font-normal"
                        >
                          {service.icon} {service.name}
                        </Label>
                      </div>
                    )
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Button type="button" variant="outline" onClick={handleCancelCreate}>
                {t("buttons.cancel")}
              </Button>
              <Button type="submit" disabled={createPackage.isPending}>
                {createPackage.isPending ? t("buttons.creating") : t("buttons.create")}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Packages List */}
      <Card>
        <CardHeader>
          <CardTitle>{t("allPackages")}</CardTitle>
          <CardDescription>
            {packages?.length || 0} {t("info.packages")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "active" | "deleted")}
            className="w-full"
          >
            <TabsList className="mb-4">
              <TabsTrigger value="active">{t("activePackages")}</TabsTrigger>
              <TabsTrigger value="deleted">{t("deletedPackages")}</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab}>
              <div className="grid gap-6 md:grid-cols-3">
                {isLoading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-64" />)}
                {!isLoading && (!packages || packages.length === 0) && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">
                      {activeTab === "active" ? t("noPackagesYet") : t("noDeletedPackages")}
                    </p>
                    <p className="text-sm">
                      {activeTab === "active" ? t("createFirst") : t("deletedWillAppear")}
                    </p>
                  </div>
                )}
                {!isLoading &&
                  packages &&
                  packages.length > 0 &&
                  packages.map(
                    (pkg: {
                      id: string;
                      name: string;
                      price: number;
                      credits: number;
                      durationDays: number;
                      features: string[];
                      services?: Array<{
                        serviceType: { id: string; name: string; icon: string | null };
                      }>;
                    }) =>
                      editingId === pkg.id ? (
                        <Card key={pkg.id}>
                          <form onSubmit={(e) => handleUpdate(e, pkg.id)}>
                            <CardHeader>
                              <div className="space-y-2">
                                <Label>{t("fields.localizedName")}</Label>
                                <LocalizedInput
                                  value={editNameI18n}
                                  onChange={setEditNameI18n}
                                  variant="input"
                                />
                                <input type="hidden" name="name_en" value={editNameI18n.en} />
                                <input type="hidden" name="name_ar" value={editNameI18n.ar} />
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="space-y-2">
                                <Label>{t("fields.localizedDescription")}</Label>
                                <LocalizedInput
                                  value={editDescI18n}
                                  onChange={setEditDescI18n}
                                  variant="textarea"
                                />
                                <input
                                  type="hidden"
                                  name="description_en"
                                  value={editDescI18n.en}
                                />
                                <input
                                  type="hidden"
                                  name="description_ar"
                                  value={editDescI18n.ar}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>{t("fields.price")}</Label>
                                <Input
                                  name="price"
                                  type="number"
                                  step="0.01"
                                  defaultValue={pkg.price}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>{t("fields.credits")}</Label>
                                <Input name="credits" type="number" defaultValue={pkg.credits} />
                              </div>
                              <div className="space-y-2">
                                <Label>{t("fields.localizedFeatures")}</Label>
                                <Tabs defaultValue="en" className="w-full">
                                  <TabsList>
                                    <TabsTrigger value="en">EN</TabsTrigger>
                                    <TabsTrigger value="ar">AR</TabsTrigger>
                                  </TabsList>
                                  <TabsContent value="en">
                                    <textarea
                                      name="features_en"
                                      className="w-full min-h-[80px] p-2 border rounded-md text-sm"
                                      defaultValue={
                                        (pkg as any).featuresI18n?.en?.join("\n") ||
                                        pkg.features.join("\n")
                                      }
                                    />
                                  </TabsContent>
                                  <TabsContent value="ar">
                                    <textarea
                                      name="features_ar"
                                      className="w-full min-h-[80px] p-2 border rounded-md text-sm"
                                      defaultValue={(pkg as any).featuresI18n?.ar?.join("\n") || ""}
                                    />
                                  </TabsContent>
                                </Tabs>
                              </div>

                              <div className="space-y-2">
                                <Label>{t("fields.includedServices")}</Label>
                                <div className="grid gap-3 md:grid-cols-2 border rounded-lg p-4">
                                  {allServices?.map(
                                    (service: {
                                      id: string;
                                      name: string;
                                      icon: string | null;
                                    }) => (
                                      <div key={service.id} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`edit-service-${service.id}`}
                                          checked={selectedServiceIds.includes(service.id)}
                                          onCheckedChange={() => toggleService(service.id)}
                                        />
                                        <Label
                                          htmlFor={`edit-service-${service.id}`}
                                          className="cursor-pointer font-normal"
                                        >
                                          {service.icon} {service.name}
                                        </Label>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter className="gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleCancelEdit}
                              >
                                {t("buttons.cancel")}
                              </Button>
                              <Button type="submit" size="sm" disabled={updatePackage.isPending}>
                                {t("buttons.save")}
                              </Button>
                            </CardFooter>
                          </form>
                        </Card>
                      ) : (
                        <Card key={pkg.id}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle>{pkg.name}</CardTitle>
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <CardDescription>
                              <span className="text-2xl font-bold text-foreground">
                                {formatCurrency(pkg.price, locale)}
                              </span>{" "}
                              / {pkg.durationDays} {t("info.dayDuration")}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2 text-sm">
                              <li>
                                {pkg.credits} {t("info.credits")}
                              </li>
                              {pkg.features.map((feature: string, i: number) => (
                                <li
                                  key={`${pkg.id}-feature-${i}`}
                                  className="text-muted-foreground"
                                >
                                  • {feature}
                                </li>
                              ))}
                            </ul>

                            {pkg.services && pkg.services.length > 0 && (
                              <div className="mt-4 pt-4 border-t">
                                <p className="text-sm font-medium mb-2">
                                  {t("info.includedServicesLabel")}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {pkg.services.map((ps) => (
                                    <Badge
                                      key={ps.serviceType.id}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {ps.serviceType.icon} {ps.serviceType.name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {(!pkg.services || pkg.services.length === 0) && (
                              <div className="mt-4 pt-4 border-t">
                                <p className="text-sm text-muted-foreground italic">
                                  {t("fields.noServicesConfigured")}
                                </p>
                              </div>
                            )}
                          </CardContent>
                          <CardFooter className="gap-2">
                            {activeTab === "active" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditPackage(pkg)}
                                className="flex items-center gap-1"
                              >
                                <Edit className="h-3 w-3" />
                                {t("buttons.edit")}
                              </Button>
                            )}
                            <Button
                              variant={activeTab === "active" ? "destructive" : "default"}
                              size="sm"
                              onClick={() => {
                                if (activeTab === "active") {
                                  if (confirm(t("confirmations.delete"))) {
                                    deletePackage.mutate({ id: pkg.id });
                                  }
                                } else if (confirm(t("confirmations.restore"))) {
                                  restorePackage.mutate({ id: pkg.id });
                                }
                              }}
                              className="flex items-center gap-1"
                            >
                              {activeTab === "active" ? (
                                <>
                                  <Trash className="h-3 w-3" />
                                  {t("buttons.delete")}
                                </>
                              ) : (
                                <>
                                  <RotateCcw className="h-3 w-3" />
                                  {t("buttons.restore")}
                                </>
                              )}
                            </Button>
                          </CardFooter>
                        </Card>
                      )
                  )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
