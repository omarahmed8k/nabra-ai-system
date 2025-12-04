"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import { formatDate, getStatusColor, formatCurrency } from "@/lib/utils";
import { Plus, CreditCard, FileText, Clock, CheckCircle } from "lucide-react";

export default function ClientDashboard() {
  const { data: session } = useSession();
  const { data: subscription, isLoading: subLoading } =
    trpc.subscription.getActive.useQuery();
  const { data: usageStats, isLoading: statsLoading } =
    trpc.subscription.getUsageStats.useQuery();
  const { data: requestsData, isLoading: requestsLoading } =
    trpc.request.getAll.useQuery({ limit: 5 });

  const isLoading = subLoading || statsLoading || requestsLoading;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {session?.user?.name?.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s an overview of your account
          </p>
        </div>
        <Link href="/client/requests/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Credits Available</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {subscription?.remainingCredits || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {subscription ? `${subscription.package.name} plan` : "No active plan"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {usageStats?.activeRequests || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  In progress or pending
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {usageStats?.completedRequests || 0}
                </div>
                <p className="text-xs text-muted-foreground">All time</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Subscription</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : subscription ? (
              <>
                <div className="text-2xl font-bold">
                  {subscription.daysRemaining}
                </div>
                <p className="text-xs text-muted-foreground">Days remaining</p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">No active plan</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* No subscription warning */}
      {!isLoading && !subscription && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">No Active Subscription</CardTitle>
            <CardDescription className="text-orange-700">
              Subscribe to a plan to start creating requests and accessing our services.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/client/subscription">
              <Button>View Plans</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Recent Requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Requests</CardTitle>
            <CardDescription>Your latest service requests</CardDescription>
          </div>
          <Link href="/client/requests">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : requestsData?.requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No requests yet</p>
              <p className="text-sm">Create your first request to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requestsData?.requests.map((request) => (
                <Link
                  key={request.id}
                  href={`/client/requests/${request.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="space-y-1">
                      <p className="font-medium">{request.title}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{request.serviceType.name}</span>
                        <span>•</span>
                        <span>{formatDate(request.createdAt)}</span>
                      </div>
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status.replace("_", " ")}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
