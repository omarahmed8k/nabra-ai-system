"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc/client";

export default function AdminSettingsPage() {
  const tPage = useTranslations("admin.settings");
  const t = useTranslations("admin.dashboard.maintenance");
  const { data: maintenance, isLoading: maintenanceLoading } =
    trpc.admin.getMaintenanceMode.useQuery();
  const utils = trpc.useUtils();
  const setMaintenanceModeMutation = trpc.admin.setMaintenanceMode.useMutation({
    onSuccess: () => {
      utils.admin.getMaintenanceMode.invalidate();
      utils.admin.getPublicAppState.invalidate();
    },
  });

  const maintenanceEnabled = maintenance?.enabled ?? false;
  let maintenanceBadgeLabel = t("disabled");
  if (maintenanceLoading) {
    maintenanceBadgeLabel = t("loading");
  } else if (maintenanceEnabled) {
    maintenanceBadgeLabel = t("enabled");
  }

  let maintenanceActionLabel = t("turnOn");
  if (setMaintenanceModeMutation.isPending) {
    maintenanceActionLabel = t("updating");
  } else if (maintenanceEnabled) {
    maintenanceActionLabel = t("turnOff");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{tPage("title")}</h1>
        <p className="text-muted-foreground">{tPage("subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge variant={maintenanceEnabled ? "destructive" : "secondary"}>
              {maintenanceBadgeLabel}
            </Badge>
          </div>
          <Button
            variant={maintenanceEnabled ? "destructive" : "default"}
            onClick={() => setMaintenanceModeMutation.mutate({ enabled: !maintenanceEnabled })}
            disabled={maintenanceLoading || setMaintenanceModeMutation.isPending}
          >
            {maintenanceActionLabel}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
