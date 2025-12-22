"use client";

import { useSession } from "next-auth/react";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { resolveLocalizedText } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import { formatDate, getStatusColor } from "@/lib/utils";
import { Plus, CreditCard, FileText, Clock, CheckCircle } from "lucide-react";

export default function ClientDashboard() {
  const t = useTranslations("client.dashboard");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { data: session } = useSession();
  const { data: subscription, isLoading: subLoading } = trpc.subscription.getActive.useQuery();
  const { data: usageStats, isLoading: statsLoading } = trpc.subscription.getUsageStats.useQuery();
  const { data: requestsData, isLoading: requestsLoading } = trpc.request.getAll.useQuery({
    limit: 5,
  });

  const isLoading = subLoading || statsLoading || requestsLoading;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {t("welcome", { name: session?.user?.name?.split(" ")[0] || "" })}
          </h1>
          <p className="text-muted-foreground">{t("overview")}</p>
        </div>
        <Link href="/client/requests/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t("newRequest")}
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.creditsAvailable")}</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{subscription?.remainingCredits || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {subscription
                    ? t("stats.plan", {
                        name: resolveLocalizedText(
                          subscription.package?.nameI18n,
                          locale,
                          subscription.package?.name
                        ),
                      })
                    : t("stats.noActivePlan")}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.activeRequests")}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{usageStats?.activeRequests || 0}</div>
                <p className="text-xs text-muted-foreground">{t("stats.inProgressOrPending")}</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.completed")}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{usageStats?.completedRequests || 0}</div>
                <p className="text-xs text-muted-foreground">{t("stats.allTime")}</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("stats.subscription")}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading && <Skeleton className="h-8 w-20" />}
            {!isLoading && subscription && (
              <>
                <div className="text-2xl font-bold">{subscription.daysRemaining}</div>
                <p className="text-xs text-muted-foreground">{t("stats.daysRemaining")}</p>
              </>
            )}
            {!isLoading && !subscription && (
              <>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">{t("stats.noActivePlan")}</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* No subscription warning */}
      {!isLoading && !subscription && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">{t("noSubscription.title")}</CardTitle>
            <CardDescription className="text-orange-700">
              {t("noSubscription.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/client/subscription">
              <Button>{t("noSubscription.viewPlans")}</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Recent Requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t("recentRequests.title")}</CardTitle>
            <CardDescription>{t("recentRequests.description")}</CardDescription>
          </div>
          <Link href="/client/requests">
            <Button variant="outline" size="sm">
              {t("recentRequests.viewAll")}
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          )}
          {!isLoading && requestsData?.requests.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>{t("recentRequests.noRequests")}</p>
              <p className="text-sm">{t("recentRequests.noRequestsDescription")}</p>
            </div>
          )}
          {!isLoading && (requestsData?.requests.length ?? 0) > 0 && (
            <div className="space-y-4">
              {requestsData?.requests.map((request: any) => {
                const serviceName = resolveLocalizedText(
                  request.serviceType?.nameI18n,
                  locale,
                  request.serviceType?.name
                );

                return (
                  <Link key={request.id} href={`/client/requests/${request.id}`} className="block">
                    <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="space-y-1">
                        <p className="font-medium">{request.title}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{serviceName}</span>
                          <span>•</span>
                          <span>{formatDate(request.createdAt, locale)}</span>
                        </div>
                      </div>
                      <Badge variant={null} className={getStatusColor(request.status)}>
                        {tCommon(`requestStatus.${request.status}` as any)}
                      </Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
