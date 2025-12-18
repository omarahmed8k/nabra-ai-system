"use client";

import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Check, CreditCard, AlertCircle } from "lucide-react";
import { showError, showSuccess } from "@/lib/error-handler";

export default function SubscriptionPage() {
  const t = useTranslations("client.subscription");
  const locale = useLocale();
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: subscription, isLoading: subLoading } = trpc.subscription.getActive.useQuery();
  const { data: packages, isLoading: pkgLoading } = trpc.package.getAll.useQuery();
  const { data: usageStats } = trpc.subscription.getUsageStats.useQuery();

  const subscribeMutation = trpc.subscription.subscribe.useMutation({
    onSuccess: () => {
      utils.subscription.getActive.invalidate();
      utils.subscription.getUsageStats.invalidate();
      utils.subscription.getPending.invalidate();
      showSuccess(t("toast.subscribed"));
      router.push("/client/payment");
    },
    onError: (error) => {
      showError(error);
    },
  });

  const cancelMutation = trpc.subscription.cancel.useMutation({
    onSuccess: () => {
      utils.subscription.getActive.invalidate();
      utils.subscription.getPending.invalidate();
      showSuccess(t("toast.cancelled"));
    },
    onError: (error) => {
      showError(error);
    },
  });

  const isLoading = subLoading || pkgLoading;

  const handleSubscribe = (packageId: string) => {
    subscribeMutation.mutate({ packageId });
  };

  const handleCancel = () => {
    if (!subscription) return;
    if (confirm(t("confirmations.cancel"))) {
      cancelMutation.mutate({ subscriptionId: subscription.id });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Current Subscription */}
      {isLoading && <Skeleton className="h-48 w-full" />}
      {!isLoading && subscription && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">
                  {t("currentSubscription.title", { name: subscription.package.name })}
                </CardTitle>
                <CardDescription>{t("currentSubscription.description")}</CardDescription>
              </div>
              <Badge variant="default">{t("currentSubscription.active")}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("currentSubscription.creditsRemaining")}
                </p>
                <p className="text-3xl font-bold">{subscription.remainingCredits}</p>
                <p className="text-sm text-muted-foreground">
                  {t("currentSubscription.ofTotal", { total: subscription.package.credits })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("currentSubscription.daysRemaining")}
                </p>
                <p className="text-3xl font-bold">{subscription.daysRemaining}</p>
                <p className="text-sm text-muted-foreground">
                  {t("currentSubscription.expires", {
                    date: formatDate(subscription.endDate, locale),
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("currentSubscription.monthlyPrice")}
                </p>
                <p className="text-3xl font-bold">
                  {formatCurrency(subscription.package.price, locale)}
                </p>
              </div>
            </div>

            {subscription.isExpiring && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2 text-orange-800">
                <AlertCircle className="h-4 w-4" />
                <span>
                  {t("currentSubscription.expiringWarning", { days: subscription.daysRemaining })}
                </span>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="destructive" onClick={handleCancel}>
              {t("currentSubscription.cancelSubscription")}
            </Button>
          </CardFooter>
        </Card>
      )}
      {!isLoading && !subscription && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">{t("noSubscription.title")}</CardTitle>
            <CardDescription className="text-orange-700">
              {t("noSubscription.description")}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-bold mb-4">
          {subscription ? t("plans.upgrade") : t("plans.choose")}
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {isLoading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-96" />)}
          {!isLoading && (!packages || packages.length === 0) && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">{t("plans.noPlans")}</p>
              <p className="text-sm">{t("plans.noPlansDesc")}</p>
            </div>
          )}
          {!isLoading &&
            packages &&
            packages.length > 0 &&
            packages.map(
              (pkg: {
                id: string;
                name: string;
                durationDays: number;
                price: number;
                credits: number;
                features: string[];
                services: { serviceType: { id: string; name: string; icon: string | null } }[];
              }) => {
                const isCurrentPlan = subscription?.package.id === pkg.id;
                return (
                  <Card
                    key={pkg.id}
                    className={`flex flex-col ${isCurrentPlan ? "border-primary" : ""}`}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{pkg.name}</CardTitle>
                        {isCurrentPlan && <Badge variant="secondary">{t("plans.current")}</Badge>}
                      </div>
                      <CardDescription>
                        <span className="text-3xl font-bold text-foreground">
                          {formatCurrency(pkg.price, locale)}
                        </span>
                        <span className="text-muted-foreground">
                          / {pkg.durationDays} {t("info.dayDuration")}
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <ul className="space-y-3">
                        <li className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-primary" />
                          <span>{pkg.credits} credits</span>
                        </li>

                        {pkg.services && pkg.services.length > 0 && (
                          <li className="flex flex-col gap-2">
                            <span className="text-sm font-medium">
                              {t("info.servicesIncluded")}:
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {pkg.services.map((svc) => (
                                <Badge
                                  key={svc.serviceType.id}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {svc.serviceType.name}
                                </Badge>
                              ))}
                            </div>
                          </li>
                        )}

                        {pkg.features.map((feature: string, i: number) => (
                          <li key={`${pkg.id}-feature-${i}`} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter className="mt-auto">
                      <Button
                        className="w-full"
                        disabled={isCurrentPlan || subscribeMutation.isPending || !!subscription}
                        onClick={() => handleSubscribe(pkg.id)}
                      >
                        {(() => {
                          if (subscribeMutation.isPending) return t("plans.processing");
                          if (isCurrentPlan) return t("plans.currentPlan");
                          if (subscription) return t("plans.cancelFirstToSwitch");
                          return t("plans.subscribe");
                        })()}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              }
            )}
        </div>
      </div>

      {/* Usage Stats */}
      {usageStats && (
        <Card>
          <CardHeader>
            <CardTitle>{t("usageStats.title")}</CardTitle>
            <CardDescription>{t("usageStats.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">{t("usageStats.totalRequests")}</p>
                <p className="text-2xl font-bold">{usageStats.totalRequests}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">{t("usageStats.completed")}</p>
                <p className="text-2xl font-bold">{usageStats.completedRequests}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">{t("usageStats.active")}</p>
                <p className="text-2xl font-bold">{usageStats.activeRequests}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">{t("usageStats.creditsUsed")}</p>
                <p className="text-2xl font-bold">{usageStats.creditsUsed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
