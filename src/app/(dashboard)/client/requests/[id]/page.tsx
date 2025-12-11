"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { AttributeResponsesDisplay } from "@/components/client/attribute-responses-display";
import { RequestHeader } from "@/components/requests/request-header";
import { RequestDescription } from "@/components/requests/request-description";
import { RequestSidebar } from "@/components/requests/request-sidebar";
import { MessagesCard } from "@/components/requests/messages-card";
import { trpc } from "@/lib/trpc/client";
import { showError } from "@/lib/error-handler";
import { CheckCircle, RotateCcw, Star } from "lucide-react";

export default function RequestDetailPage() {
  const params = useParams();
  const requestId = params.id as string;
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [revisionFeedback, setRevisionFeedback] = useState("");

  const utils = trpc.useUtils();

  const { data: request, isLoading } = trpc.request.getById.useQuery({
    id: requestId,
  });

  // Validation constants
  const MIN_REVISION_FEEDBACK = 10;
  const revisionFeedbackValid = revisionFeedback.trim().length >= MIN_REVISION_FEEDBACK;

  const approveRequest = trpc.request.approve.useMutation({
    onSuccess: () => {
      utils.request.getById.invalidate({ id: requestId });
      toast.success("Request Approved!", {
        description: "The deliverable has been approved. Great work!",
      });
    },
    onError: (error: unknown) => {
      showError(error, "Failed to approve request");
    },
  });

  const requestRevision = trpc.request.requestRevision.useMutation({
    onSuccess: () => {
      setRevisionFeedback("");
      utils.request.getById.invalidate({ id: requestId });
      toast.info("Revision Requested", {
        description: "The provider has been notified about your revision request.",
      });
    },
    onError: (error: unknown) => {
      showError(error, "Failed to request revision");
    },
  });

  const submitRating = trpc.request.rate.useMutation({
    onSuccess: () => {
      utils.request.getById.invalidate({ id: requestId });
      toast.success("Rating Submitted", {
        description: "Thank you for your feedback!",
      });
    },
    onError: (error: unknown) => {
      showError(error, "Failed to submit rating");
    },
  });

  const handleApprove = () => {
    approveRequest.mutate({ requestId });
  };

  const handleRequestRevision = () => {
    if (!revisionFeedbackValid) {
      toast.error("Invalid Feedback", {
        description: `Please provide at least ${MIN_REVISION_FEEDBACK} characters describing the changes needed.`,
      });
      return;
    }
    requestRevision.mutate({ requestId, feedback: revisionFeedback });
  };

  const handleSubmitRating = () => {
    if (rating === 0) return;
    submitRating.mutate({ requestId, rating, reviewText });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Request not found</h2>
        <Link href="/client/requests">
          <Button className="mt-4">Back to Requests</Button>
        </Link>
      </div>
    );
  }

  const canApprove = request.status === "DELIVERED";
  const canRate = request.status === "COMPLETED" && !request.rating;
  const revisionInfo = request.revisionInfo;

  return (
    <div className="space-y-6">
      {/* Header */}
      <RequestHeader
        title={request.title}
        status={request.status}
        priority={request.priority}
        creditCost={(request as any).creditCost}
        baseCreditCost={(request as any).baseCreditCost}
        priorityCreditCost={(request as any).priorityCreditCost}
        isRevision={(request as any).isRevision}
        revisionType={(request as any).revisionType}
        paidRevisionCost={(request.serviceType as any).paidRevisionCost}
        serviceTypeName={request.serviceType.name}
        serviceTypeIcon={request.serviceType.icon || undefined}
        createdAt={request.createdAt}
        backUrl="/client/requests"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <RequestDescription description={request.description} attachments={request.attachments} />

          {/* Service-Specific Q&A Responses */}
          {(request as any).attributeResponses &&
            Array.isArray((request as any).attributeResponses) &&
            (request as any).attributeResponses.length > 0 && (
              <AttributeResponsesDisplay responses={(request as any).attributeResponses} />
            )}

          {/* Actions for DELIVERED status */}
          {canApprove && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-800">Deliverable Ready</CardTitle>
                <CardDescription className="text-blue-700">
                  Review the deliverable and either approve or request a revision.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Button onClick={handleApprove} disabled={approveRequest.isPending}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {approveRequest.isPending ? "Approving..." : "Approve & Complete"}
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-600">Request Revision</span>
                    {revisionInfo && (
                      <span className="text-sm text-muted-foreground">
                        {revisionInfo.freeRevisionsRemaining > 0 ? (
                          <span className="text-green-600">
                            ({revisionInfo.freeRevisionsRemaining} free{" "}
                            {revisionInfo.freeRevisionsRemaining === 1 ? "revision" : "revisions"}{" "}
                            remaining)
                          </span>
                        ) : (
                          <span className="text-orange-600">
                            (No free revisions left - costs {revisionInfo.nextRevisionCost} credit)
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Textarea
                      placeholder="Describe what changes you need..."
                      value={revisionFeedback}
                      onChange={(e) => setRevisionFeedback(e.target.value)}
                      className={
                        revisionFeedback.length > 0 && !revisionFeedbackValid
                          ? "border-red-500"
                          : ""
                      }
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span
                        className={
                          revisionFeedback.length > 0 && !revisionFeedbackValid
                            ? "text-red-500"
                            : ""
                        }
                      >
                        {revisionFeedback.length > 0 &&
                          !revisionFeedbackValid &&
                          `Minimum ${MIN_REVISION_FEEDBACK} characters required`}
                      </span>
                      <span
                        className={
                          revisionFeedback.trim().length < MIN_REVISION_FEEDBACK
                            ? "text-red-500"
                            : "text-green-600"
                        }
                      >
                        {revisionFeedback.trim().length}/{MIN_REVISION_FEEDBACK}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleRequestRevision}
                    disabled={!revisionFeedbackValid || requestRevision.isPending}
                  >
                    {requestRevision.isPending ? "Requesting..." : "Request Revision"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rating section for COMPLETED status */}
          {canRate && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800">Rate This Service</CardTitle>
                <CardDescription className="text-green-700">
                  Share your experience with this provider
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`p-1 ${star <= rating ? "text-yellow-500" : "text-gray-300"}`}
                    >
                      <Star className="h-8 w-8 fill-current" />
                    </button>
                  ))}
                </div>
                <div className="space-y-1">
                  <Textarea
                    placeholder="Write a review (optional)..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                  />
                  {reviewText.length > 0 && (
                    <div className="flex justify-end text-xs text-muted-foreground">
                      <span>{reviewText.length} characters</span>
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleSubmitRating}
                  disabled={rating === 0 || submitRating.isPending}
                >
                  {submitRating.isPending ? "Submitting..." : "Submit Rating"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Existing Rating */}
          {request.rating && (
            <Card>
              <CardHeader>
                <CardTitle>Your Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= request.rating!.rating
                          ? "text-yellow-500 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                {request.rating.reviewText && (
                  <p className="text-muted-foreground">{request.rating.reviewText}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Chat */}
          <MessagesCard
            requestId={requestId}
            comments={request.comments as any}
            title="Messages"
            description="Communicate with your provider"
            placeholder="Type your message..."
            canSendMessages={request.status !== "COMPLETED"}
          />
        </div>

        {/* Sidebar */}
        <RequestSidebar
          provider={request.provider}
          serviceTypeName={request.serviceType.name}
          serviceTypeIcon={request.serviceType.icon || undefined}
          createdAt={request.createdAt}
          estimatedDelivery={request.estimatedDelivery}
          completedAt={request.completedAt}
          currentRevisionCount={request.currentRevisionCount}
          totalRevisions={request.totalRevisions}
          revisionInfo={revisionInfo || undefined}
        />
      </div>
    </div>
  );
}
