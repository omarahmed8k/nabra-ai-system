"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineFileUpload, type UploadedFile } from "@/components/ui/file-upload";
import { trpc } from "@/lib/trpc/client";
import { showError } from "@/lib/error-handler";
import {
  formatDate,
  formatDateTime,
  getStatusColor,
  getPriorityLabel,
  getPriorityColor,
  getInitials,
} from "@/lib/utils";
import {
  ArrowLeft,
  Send,
  CheckCircle,
  RotateCcw,
  Star,
  AlertCircle,
} from "lucide-react";

export default function RequestDetailPage() {
  const params = useParams();
  const requestId = params.id as string;
  const [comment, setComment] = useState("");
  const [commentFiles, setCommentFiles] = useState<UploadedFile[]>([]);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [revisionFeedback, setRevisionFeedback] = useState("");

  const utils = trpc.useUtils();

  const { data: request, isLoading } = trpc.request.getById.useQuery({
    id: requestId,
  });

  const addComment = trpc.request.addComment.useMutation({
    onSuccess: () => {
      setComment("");
      utils.request.getById.invalidate({ id: requestId });
      toast.success("Message Sent", {
        description: "Your message has been sent to the provider.",
      });
    },
    onError: (error: unknown) => {
      showError(error, "Failed to send message");
    },
  });

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

  const handleSendComment = () => {
    if (!comment.trim() && commentFiles.length === 0) return;
    addComment.mutate({ 
      requestId, 
      content: comment || "(Attachment)",
      files: commentFiles.map((f) => f.url),
    });
    setCommentFiles([]);
  };

  const handleApprove = () => {
    approveRequest.mutate({ requestId });
  };

  const handleRequestRevision = () => {
    if (!revisionFeedback.trim()) return;
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
      <div className="flex items-start gap-4">
        <Link href="/client/requests">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{request.title}</h1>
            <Badge className={getStatusColor(request.status)}>
              {request.status.replace("_", " ")}
            </Badge>
            <Badge className={getPriorityColor(request.priority)}>
              {getPriorityLabel(request.priority)} Priority
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {request.serviceType.name} • Created {formatDate(request.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="whitespace-pre-wrap">{request.description}</p>
              
              {/* Request Attachments */}
              {request.attachments && request.attachments.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Attachments ({request.attachments.length})</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {request.attachments.map((file: string, index: number) => {
                      const fileName = file.split('/').pop() || `Attachment ${index + 1}`;
                      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file);
                      return (
                        <a
                          key={file}
                          href={file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group block p-2 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
                        >
                          {isImage ? (
                            <div className="aspect-video rounded overflow-hidden bg-muted mb-2 flex items-center justify-center">
                              <img
                                src={file}
                                alt={fileName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="aspect-video rounded bg-muted mb-2 flex items-center justify-center text-2xl">
                              📎
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground truncate group-hover:text-foreground">
                            {fileName}
                          </p>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

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
                    <RotateCcw className="h-4 w-4" />
                    <span className="font-medium">Request Revision</span>
                    {revisionInfo && (
                      <span className="text-sm text-muted-foreground">
                        ({revisionInfo.freeRevisionsRemaining} free remaining,
                        next costs {revisionInfo.nextRevisionCost} credit)
                      </span>
                    )}
                  </div>
                  <Textarea
                    placeholder="Describe what changes you need..."
                    value={revisionFeedback}
                    onChange={(e) => setRevisionFeedback(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    onClick={handleRequestRevision}
                    disabled={!revisionFeedback.trim() || requestRevision.isPending}
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
                      className={`p-1 ${
                        star <= rating ? "text-yellow-500" : "text-gray-300"
                      }`}
                    >
                      <Star className="h-8 w-8 fill-current" />
                    </button>
                  ))}
                </div>
                <Textarea
                  placeholder="Write a review (optional)..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                />
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
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <CardDescription>
                Communicate with your provider
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {request.comments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No messages yet
                </p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {request.comments.map((comment: { id: string; type: string; content: string; createdAt: Date; user: { name: string | null; image: string | null }; files: string[] }) => (
                    <div
                      key={comment.id}
                      className={`flex gap-3 ${
                        comment.type === "SYSTEM"
                          ? "bg-muted/50 p-3 rounded-lg"
                          : ""
                      }`}
                    >
                      {comment.type !== "SYSTEM" && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.user.image || ""} />
                          <AvatarFallback>
                            {getInitials(comment.user.name || "")}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {comment.type === "SYSTEM"
                              ? "System"
                              : comment.user.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(comment.createdAt)}
                          </span>
                          {comment.type === "DELIVERABLE" && (
                            <Badge variant="secondary">Deliverable</Badge>
                          )}
                        </div>
                        <p className="text-sm mt-1 whitespace-pre-wrap">
                          {comment.content}
                        </p>
                        {comment.files.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {comment.files.map((file: string, i: number) => (
                              <a
                                key={`${comment.id}-file-${i}`}
                                href={file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline block"
                              >
                                📎 Attachment {i + 1}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                <InlineFileUpload
                  onFilesChange={setCommentFiles}
                  maxFiles={3}
                  disabled={addComment.isPending}
                />
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                  />
                  <Button
                    size="icon"
                    onClick={handleSendComment}
                    disabled={(!comment.trim() && commentFiles.length === 0) || addComment.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Provider Info */}
          <Card>
            <CardHeader>
              <CardTitle>Provider</CardTitle>
            </CardHeader>
            <CardContent>
              {request.provider ? (
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={request.provider.image || ""} />
                    <AvatarFallback>
                      {getInitials(request.provider.name || "")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{request.provider.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {request.provider.email}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>Waiting for provider</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Request Info */}
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
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{formatDateTime(request.createdAt)}</p>
              </div>
              {request.estimatedDelivery && (
                <div>
                  <p className="text-sm text-muted-foreground">Est. Delivery</p>
                  <p className="font-medium">
                    {formatDate(request.estimatedDelivery)}
                  </p>
                </div>
              )}
              {request.completedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="font-medium">
                    {formatDateTime(request.completedAt)}
                  </p>
                </div>
              )}
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Revisions</p>
                <p className="font-medium">
                  {request.totalRevisions} total
                  {revisionInfo && (
                    <span className="text-muted-foreground">
                      {" "}
                      ({revisionInfo.freeRevisionsRemaining}/{revisionInfo.maxFree} free
                      remaining)
                    </span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
