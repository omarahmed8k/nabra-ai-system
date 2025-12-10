"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import {
  formatDate,
  formatDateTime,
  getPriorityLabel,
  getPriorityColor,
} from "@/lib/utils";
import { ArrowLeft, Clock, User } from "lucide-react";

export default function AvailableJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const { data: request, isLoading } = trpc.request.getById.useQuery({
    id: requestId,
  });

  const claimRequest = trpc.provider.claimRequest.useMutation({
    onSuccess: () => {
      router.push(`/provider/requests/${requestId}`);
    },
  });

  const handleClaim = () => {
    if (confirm("Are you sure you want to claim this request?")) {
      claimRequest.mutate({ requestId });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Request not found</h2>
        <Link href="/provider/available">
          <Button className="mt-4">Back to Available Jobs</Button>
        </Link>
      </div>
    );
  }

  // If already assigned, redirect
  if (request.provider) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">This job has already been claimed</h2>
        <Link href="/provider/available">
          <Button className="mt-4">Browse Available Jobs</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/provider/available">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{request.title}</h1>
            <Badge className={getPriorityColor(request.priority)}>
              {getPriorityLabel(request.priority)} Priority
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {request.serviceType.icon} {request.serviceType.name} • Posted{" "}
            {formatDate(request.createdAt)}
          </p>
        </div>
        <Button
          size="lg"
          onClick={handleClaim}
          disabled={claimRequest.isPending}
        >
          {claimRequest.isPending ? "Claiming..." : "Claim This Job"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{request.description}</p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Client</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{request.client.name}</p>
                  <p className="text-sm text-muted-foreground">Client</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Service Type</p>
                <p className="font-medium">
                  {request.serviceType.icon} {request.serviceType.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Posted</p>
                <p className="font-medium flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDateTime(request.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Priority</p>
                <Badge className={getPriorityColor(request.priority)}>
                  {getPriorityLabel(request.priority)}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Credit Value</p>
                <p className="font-medium">
                  💳 {request.creditCost} {request.creditCost === 1 ? 'credit' : 'credits'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
