"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RequestCard } from "@/components/requests/request-card";
import { EmptyRequestsState } from "@/components/requests/empty-requests-state";
import { trpc } from "@/lib/trpc/client";

export default function MyRequestsPage() {
  const { data: requestsData, isLoading } = trpc.provider.getMyRequests.useQuery({
    limit: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Requests</h1>
        <p className="text-muted-foreground">Manage requests you&apos;re working on</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All My Requests</CardTitle>
          <CardDescription>{requestsData?.requests.length || 0} total requests</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          )}
          {!isLoading && requestsData?.requests.length === 0 && (
            <EmptyRequestsState
              title="No requests yet"
              description="Claim available jobs to get started"
              actionLabel="Browse Available Jobs"
              actionHref="/provider/available"
            />
          )}
          {!isLoading && (requestsData?.requests.length ?? 0) > 0 && (
            <div className="space-y-4">
              {requestsData?.requests.map((request: any) => (
                <RequestCard
                  key={request.id}
                  id={request.id}
                  title={request.title}
                  status={request.status}
                  creditCost={request.creditCost || 0}
                  createdAt={request.createdAt}
                  serviceType={request.serviceType}
                  client={request.client}
                  commentCount={request._count.comments}
                  href={`/provider/requests/${request.id}`}
                  variant="compact"
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
