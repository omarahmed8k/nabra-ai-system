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
import { formatDate, getStatusColor } from "@/lib/utils";
import { FileText, CheckCircle, Star, TrendingUp } from "lucide-react";

export default function ProviderDashboard() {
  const { data: session } = useSession();
  
  const { data: myRequests, isLoading: myReqLoading } =
    trpc.provider.getMyRequests.useQuery({ limit: 5 });
  const { data: availableRequests, isLoading: availableLoading } =
    trpc.provider.getAvailableRequests.useQuery({ limit: 5 });
  const { data: stats, isLoading: statsLoading } =
    trpc.provider.getStats.useQuery();

  const isLoading = myReqLoading || availableLoading || statsLoading;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {session?.user?.name?.split(" ")[0]}!
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s your provider dashboard overview
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.activeRequests || 0}</div>
                <p className="text-xs text-muted-foreground">In progress</p>
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
                  {stats?.completedRequests || 0}
                </div>
                <p className="text-xs text-muted-foreground">All time</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.averageRating?.toFixed(1) || "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.totalRatings || 0} reviews
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Available Jobs</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {availableRequests?.requests.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Waiting for provider
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Active Jobs</CardTitle>
              <CardDescription>Requests you&apos;re working on</CardDescription>
            </div>
            <Link href="/provider/my-requests">
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
            ) : myRequests?.requests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No active jobs</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myRequests?.requests.map((request) => (
                  <Link
                    key={request.id}
                    href={`/provider/requests/${request.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="space-y-1">
                        <p className="font-medium">{request.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {request.serviceType.name} • {formatDate(request.createdAt)}
                        </p>
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

        {/* Available Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Available Jobs</CardTitle>
              <CardDescription>Pick up new work</CardDescription>
            </div>
            <Link href="/provider/available">
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
            ) : availableRequests?.requests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No available jobs</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableRequests?.requests.map((request) => (
                  <Link
                    key={request.id}
                    href={`/provider/available/${request.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="space-y-1">
                        <p className="font-medium">{request.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {request.serviceType.name} • {formatDate(request.createdAt)}
                        </p>
                      </div>
                      <Badge variant="secondary">New</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
