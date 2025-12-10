"use client";

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
import { Plus, FileText } from "lucide-react";

export default function RequestsPage() {
  const { data: requestsData, isLoading } = trpc.request.getAll.useQuery({
    limit: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Requests</h1>
          <p className="text-muted-foreground">
            View and manage all your service requests
          </p>
        </div>
        <Link href="/client/requests/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
          <CardDescription>
            {requestsData?.requests.length || 0} total requests
          </CardDescription>
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
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No requests yet</p>
              <p className="text-sm">Create your first request to get started</p>
              <Link href="/client/requests/new">
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Request
                </Button>
              </Link>
            </div>
          )}
          {!isLoading && (requestsData?.requests.length ?? 0) > 0 && (
            <div className="space-y-4">
              {requestsData?.requests.map((request: { id: string; title: string; status: string; createdAt: Date; serviceType: { name: string }; provider?: { name: string | null } | null; _count: { comments: number }; creditCost: number }) => (
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
                        <span>•</span>
                        <span className="font-medium">💳 {request.creditCost} {request.creditCost === 1 ? 'credit' : 'credits'}</span>
                        {request.provider && (
                          <>
                            <span>•</span>
                            <span>Provider: {request.provider.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {request._count.comments} messages
                      </span>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status.replace("_", " ")}
                      </Badge>
                    </div>
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
