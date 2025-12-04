"use client";

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

export default function SubscriptionPage() {
  const utils = trpc.useUtils();

  const { data: subscription, isLoading: subLoading } =
    trpc.subscription.getActive.useQuery();
  const { data: packages, isLoading: pkgLoading } = trpc.package.getAll.useQuery();
  const { data: usageStats } = trpc.subscription.getUsageStats.useQuery();

  const subscribeMutation = trpc.subscription.subscribe.useMutation({
    onSuccess: () => {
      utils.subscription.getActive.invalidate();
      utils.subscription.getUsageStats.invalidate();
    },
  });

  const cancelMutation = trpc.subscription.cancel.useMutation({
    onSuccess: () => {
      utils.subscription.getActive.invalidate();
    },
  });

  const isLoading = subLoading || pkgLoading;

  const handleSubscribe = (packageId: string) => {
    subscribeMutation.mutate({ packageId });
  };

  const handleCancel = () => {
    if (!subscription) return;
    if (confirm("Are you sure you want to cancel your subscription?")) {
      cancelMutation.mutate({ subscriptionId: subscription.id });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription and credits
        </p>
      </div>

      {/* Current Subscription */}
      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : subscription ? (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">
                  {subscription.package.name} Plan
                </CardTitle>
                <CardDescription>
                  Your current active subscription
                </CardDescription>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Credits Remaining</p>
                <p className="text-3xl font-bold">{subscription.remainingCredits}</p>
                <p className="text-sm text-muted-foreground">
                  of {subscription.package.credits} total
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Free Revisions</p>
                <p className="text-3xl font-bold">
                  {subscription.package.maxFreeRevisions}
                </p>
                <p className="text-sm text-muted-foreground">per request</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Days Remaining</p>
                <p className="text-3xl font-bold">{subscription.daysRemaining}</p>
                <p className="text-sm text-muted-foreground">
                  Expires {formatDate(subscription.endDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Price</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(subscription.package.price)}
                </p>
              </div>
            </div>

            {subscription.isExpiring && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2 text-orange-800">
                <AlertCircle className="h-4 w-4" />
                <span>Your subscription expires in {subscription.daysRemaining} days</span>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="destructive" onClick={handleCancel}>
              Cancel Subscription
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">No Active Subscription</CardTitle>
            <CardDescription className="text-orange-700">
              Subscribe to a plan below to start creating requests
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-bold mb-4">
          {subscription ? "Upgrade Your Plan" : "Choose a Plan"}
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {isLoading
            ? [1, 2, 3].map((i) => <Skeleton key={i} className="h-96" />)
            : packages?.map((pkg: { id: string; name: string; price: number; credits: number; maxFreeRevisions: number; features: string[] }) => {
                const isCurrentPlan = subscription?.package.id === pkg.id;
                return (
                  <Card
                    key={pkg.id}
                    className={isCurrentPlan ? "border-primary" : ""}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{pkg.name}</CardTitle>
                        {isCurrentPlan && (
                          <Badge variant="secondary">Current</Badge>
                        )}
                      </div>
                      <CardDescription>
                        <span className="text-3xl font-bold text-foreground">
                          {formatCurrency(pkg.price)}
                        </span>
                        <span className="text-muted-foreground">/month</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        <li className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-primary" />
                          <span>{pkg.credits} credits</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>{pkg.maxFreeRevisions} free revisions/request</span>
                        </li>
                        {pkg.features.map((feature: string, i: number) => (
                          <li key={feature} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        disabled={
                          isCurrentPlan ||
                          subscribeMutation.isPending ||
                          !!subscription
                        }
                        onClick={() => handleSubscribe(pkg.id)}
                      >
                        {subscribeMutation.isPending
                          ? "Processing..."
                          : isCurrentPlan
                          ? "Current Plan"
                          : subscription
                          ? "Cancel first to switch"
                          : "Subscribe"}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
        </div>
      </div>

      {/* Usage Stats */}
      {usageStats && (
        <Card>
          <CardHeader>
            <CardTitle>Usage Statistics</CardTitle>
            <CardDescription>Your credit usage this billing period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{usageStats.totalRequests}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{usageStats.completedRequests}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{usageStats.activeRequests}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Credits Used</p>
                <p className="text-2xl font-bold">{usageStats.creditsUsed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
