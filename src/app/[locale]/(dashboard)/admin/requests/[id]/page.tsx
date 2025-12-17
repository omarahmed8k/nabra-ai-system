"use client";

import { useParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, FileText } from "lucide-react";
import { AttributeResponsesDisplay } from "@/components/client/attribute-responses-display";
import { RequestHeader } from "@/components/requests/request-header";
import { RequestDescription } from "@/components/requests/request-description";
import { RequestSidebar } from "@/components/requests/request-sidebar";
import { MessagesCard } from "@/components/requests/messages-card";
import { trpc } from "@/lib/trpc/client";

export default function AdminRequestDetailPage() {
  const params = useParams();
  const requestId = params.id as string;

  const { data: request, isLoading } = trpc.request.getById.useQuery({ id: requestId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium">Request not found</h3>
        <p className="text-muted-foreground mb-4">
          The request you're looking for doesn't exist or has been deleted.
        </p>
        <Link href="/admin/requests">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Requests
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <RequestHeader
        title={request.title}
        status={request.status}
        priority={request.priority}
        creditCost={(request as any).creditCost}
        baseCreditCost={request.baseCreditCost}
        priorityCreditCost={request.priorityCreditCost}
        isRevision={request.isRevision}
        revisionType={request.revisionType}
        paidRevisionCost={(request.serviceType as any).paidRevisionCost}
        serviceTypeName={request.serviceType.name}
        serviceTypeIcon={request.serviceType.icon || undefined}
        createdAt={request.createdAt}
        backUrl="/admin/requests"
        backLabel="Back to Requests"
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          <RequestDescription description={request.description} attachments={request.attachments} />

          {/* Service-Specific Q&A Responses */}
          {(request as any).attributeResponses &&
            Array.isArray((request as any).attributeResponses) &&
            (request as any).attributeResponses.length > 0 && (
              <AttributeResponsesDisplay responses={(request as any).attributeResponses} />
            )}

          {/* Messages */}
          <MessagesCard
            requestId={requestId}
            comments={request.comments as any}
            title="Messages"
            description="Communicate with client and provider"
            placeholder="Send a message to client or provider..."
            canSendMessages={request.status !== "COMPLETED"}
          />
        </div>

        {/* Sidebar */}
        <RequestSidebar
          client={request.client}
          provider={request.provider || null}
          serviceTypeName={request.serviceType.name}
          serviceTypeIcon={request.serviceType.icon || undefined}
          createdAt={request.createdAt}
          updatedAt={request.updatedAt}
          estimatedDelivery={request.estimatedDelivery}
          completedAt={request.completedAt}
          currentRevisionCount={request.currentRevisionCount}
          totalRevisions={request.totalRevisions}
        />
      </div>
    </div>
  );
}
