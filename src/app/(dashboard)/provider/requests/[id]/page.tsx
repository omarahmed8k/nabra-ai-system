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
import { FileUpload, InlineFileUpload, type UploadedFile } from "@/components/ui/file-upload";
import { AttributeResponsesDisplay } from "@/components/client/attribute-responses-display";
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
  Upload,
  Play,
  CheckCircle,
} from "lucide-react";

export default function ProviderRequestDetailPage() {
  const params = useParams();
  const requestId = params.id as string;
  const [comment, setComment] = useState("");
  const [commentFiles, setCommentFiles] = useState<UploadedFile[]>([]);
  const [deliverable, setDeliverable] = useState("");
  const [deliverableFiles, setDeliverableFiles] = useState<UploadedFile[]>([]);

  const utils = trpc.useUtils();

  const { data: request, isLoading } = trpc.request.getById.useQuery({
    id: requestId,
  });

  const addComment = trpc.request.addComment.useMutation({
    onSuccess: () => {
      setComment("");
      utils.request.getById.invalidate({ id: requestId });
      toast.success("Message Sent", {
        description: "Your message has been sent to the client.",
      });
    },
    onError: (error) => {
      showError(error, "Failed to send message");
    },
  });

  const startWork = trpc.provider.startWork.useMutation({
    onSuccess: () => {
      utils.request.getById.invalidate({ id: requestId });
      toast.success("Work Started", {
        description: "You've started working on this request.",
      });
    },
    onError: (error) => {
      showError(error, "Failed to start work");
    },
  });

  const deliverWork = trpc.provider.deliverWork.useMutation({
    onSuccess: () => {
      setDeliverable("");
      utils.request.getById.invalidate({ id: requestId });
      toast.success("Deliverable Submitted", {
        description: "Your deliverable has been submitted for client review.",
      });
    },
    onError: (error) => {
      showError(error, "Failed to submit deliverable");
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

  const handleStartWork = () => {
    startWork.mutate({ requestId });
  };

  const handleDeliver = () => {
    if (!deliverable.trim()) return;
    deliverWork.mutate({ 
      requestId, 
      deliverableMessage: deliverable,
      files: deliverableFiles.map((f) => f.url),
    });
    setDeliverableFiles([]);
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
        <Link href="/provider/my-requests">
          <Button className="mt-4">Back to My Requests</Button>
        </Link>
      </div>
    );
  }

  const canStart = request.status === "PENDING";
  const canDeliver =
    request.status === "IN_PROGRESS" || request.status === "REVISION_REQUESTED";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/provider/my-requests">
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
            <Badge variant="outline" className="font-semibold">
              💳 {(request as any).creditCost} {(request as any).creditCost === 1 ? 'credit' : 'credits'}
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

          {/* Service-Specific Q&A Responses */}
          {(request as any).attributeResponses && Array.isArray((request as any).attributeResponses) && (request as any).attributeResponses.length > 0 && (
            <AttributeResponsesDisplay responses={(request as any).attributeResponses} />
          )}

          {/* Action Card */}
          {canStart && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-800">Start Working</CardTitle>
                <CardDescription className="text-blue-700">
                  Click below to start working on this request
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleStartWork} disabled={startWork.isPending}>
                  <Play className="mr-2 h-4 w-4" />
                  {startWork.isPending ? "Starting..." : "Start Work"}
                </Button>
              </CardContent>
            </Card>
          )}

          {canDeliver && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800">Submit Deliverable</CardTitle>
                <CardDescription className="text-green-700">
                  Ready to deliver? Submit your work for client review.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    placeholder="Describe what you've completed and include any relevant links or notes..."
                    value={deliverable}
                    onChange={(e) => setDeliverable(e.target.value)}
                    rows={4}
                  />
                  {deliverable.length > 0 && deliverable.length < 5 && (
                    <p className="text-sm text-amber-600">
                      Please enter at least 5 characters ({5 - deliverable.length} more needed)
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-800">Attach Deliverable Files</p>
                  <FileUpload
                    onFilesChange={setDeliverableFiles}
                    maxFiles={10}
                    maxSizeMB={10}
                    disabled={deliverWork.isPending}
                    className="bg-white/50"
                  />
                </div>
                <Button
                  onClick={handleDeliver}
                  disabled={deliverable.trim().length < 5 || deliverWork.isPending}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {deliverWork.isPending ? "Submitting..." : "Submit Deliverable"}
                </Button>
              </CardContent>
            </Card>
          )}

          {request.status === "DELIVERED" && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-800">
                  Awaiting Client Review
                </CardTitle>
                <CardDescription className="text-yellow-700">
                  The client is reviewing your deliverable. They may approve or
                  request revisions.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {request.status === "COMPLETED" && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-green-800">Completed</CardTitle>
                </div>
                <CardDescription className="text-green-700">
                  Great work! The client has approved your deliverable.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Chat */}
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <CardDescription>
                Communicate with the client
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {request.comments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No messages yet
                </p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {request.comments.map((comment: { id: string; content: string; type: string; createdAt: Date; files?: string[]; user: { name: string | null; image: string | null } }) => (
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
                        {comment.files && comment.files.length > 0 && (
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
          {/* Client Info */}
          <Card>
            <CardHeader>
              <CardTitle>Client</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={request.client.image || ""} />
                  <AvatarFallback>
                    {getInitials(request.client.name || "")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{request.client.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {request.client.email}
                  </p>
                </div>
              </div>
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
                <p className="font-medium">{request.totalRevisions} total</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
