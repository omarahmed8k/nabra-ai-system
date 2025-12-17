import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { AlertCircle } from "lucide-react";
import { formatDateTime, getInitials } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface UserInfo {
  name: string | null;
  email: string | null;
  image: string | null;
}

interface RequestSidebarProps {
  readonly client?: UserInfo;
  readonly provider?: UserInfo | null;
  readonly serviceTypeName: string;
  readonly serviceTypeIcon?: string;
  readonly createdAt: Date;
  readonly updatedAt?: Date;
  readonly estimatedDelivery?: Date | null;
  readonly completedAt?: Date | null;
  readonly currentRevisionCount?: number;
  readonly totalRevisions?: number;
  readonly revisionInfo?: {
    freeRevisionsRemaining: number;
    maxFree: number;
    nextRevisionCost: number;
  };
}

export function RequestSidebar({
  client,
  provider,
  serviceTypeName,
  serviceTypeIcon,
  createdAt,
  updatedAt,
  estimatedDelivery,
  completedAt,
  currentRevisionCount,
  totalRevisions,
  revisionInfo,
}: RequestSidebarProps) {
  const t = useTranslations("requests.sidebar");

  return (
    <div className="space-y-6">
      {/* Client Info */}
      {client && (
        <Card>
          <CardHeader>
            <CardTitle>{t("client")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={client.image || ""} />
                <AvatarFallback>{getInitials(client.name || client.email || "")}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{client.name || t("noName")}</p>
                <p className="text-sm text-muted-foreground">{client.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Provider Info */}
      {provider !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle>{t("provider")}</CardTitle>
          </CardHeader>
          <CardContent>
            {provider ? (
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={provider.image || ""} />
                  <AvatarFallback>
                    {getInitials(provider.name || provider.email || "")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{provider.name || t("noName")}</p>
                  <p className="text-sm text-muted-foreground">{provider.email}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>{t("waitingForProvider")}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Request Details */}
      <Card>
        <CardHeader>
          <CardTitle>{t("details")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">{t("serviceType")}</p>
            <p className="font-medium">
              {serviceTypeIcon && `${serviceTypeIcon} `}
              {serviceTypeName}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("created")}</p>
            <p className="font-medium">{formatDateTime(createdAt)}</p>
          </div>
          {updatedAt && (
            <div>
              <p className="text-sm text-muted-foreground">{t("updated")}</p>
              <p className="font-medium">{formatDateTime(updatedAt)}</p>
            </div>
          )}
          {estimatedDelivery && (
            <div>
              <p className="text-sm text-muted-foreground">{t("estimatedDelivery")}</p>
              <p className="font-medium">{formatDateTime(estimatedDelivery)}</p>
              {new Date(estimatedDelivery) > new Date() && (
                <p className="text-xs text-blue-600 mt-1">
                  {(() => {
                    const hoursRemaining = Math.max(
                      0,
                      Math.round(
                        (new Date(estimatedDelivery).getTime() - Date.now()) / (1000 * 60 * 60)
                      )
                    );
                    if (hoursRemaining < 24) {
                      return t("hoursRemaining", {
                        hours: hoursRemaining,
                      });
                    } else {
                      const daysRemaining = Math.round(hoursRemaining / 24);
                      return t("daysRemaining", {
                        days: daysRemaining,
                      });
                    }
                  })()}
                </p>
              )}
              {new Date(estimatedDelivery) <= new Date() && (
                <p className="text-xs text-amber-600 mt-1">{t("deliveryTimePassed")}</p>
              )}
            </div>
          )}
          {completedAt && (
            <div>
              <p className="text-sm text-muted-foreground">{t("completed")}</p>
              <p className="font-medium">{formatDateTime(completedAt)}</p>
            </div>
          )}
          {(currentRevisionCount !== undefined || totalRevisions !== undefined) && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">{t("revisions")}</p>
                <p className="font-medium">
                  {t("totalRequested", { total: totalRevisions || 0 })}
                  {revisionInfo && (
                    <>
                      <br />
                      <span className="text-sm text-muted-foreground">
                        {t("freeUsed", {
                          used: revisionInfo.maxFree - revisionInfo.freeRevisionsRemaining,
                          max: revisionInfo.maxFree,
                        })}
                        {revisionInfo.freeRevisionsRemaining > 0 && (
                          <span className="text-green-600">
                            {" "}
                            {t("freeRemaining", { remaining: revisionInfo.freeRevisionsRemaining })}
                          </span>
                        )}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
