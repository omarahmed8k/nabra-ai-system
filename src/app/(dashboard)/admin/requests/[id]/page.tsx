"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { InlineFileUpload, type UploadedFile } from "@/components/ui/file-upload";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  PlayCircle,
  Package,
  User,
  Calendar,
  FileText,
  Send,
} from "lucide-react";
import Link from "next/link";
import { AttributeResponsesDisplay } from "@/components/client/attribute-responses-display";
import { showError } from "@/lib/error-handler";
import { formatDateTime, getInitials } from "@/lib/utils";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  REVISION_REQUESTED: "bg-orange-100 text-orange-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const statusIcons: Record<string, React.ReactNode> = {
  PENDING: <Clock className="h-4 w-4" />,
  APPROVED: <CheckCircle className="h-4 w-4" />,
  IN_PROGRESS: <PlayCircle className="h-4 w-4" />,
  DELIVERED: <Package className="h-4 w-4" />,
  REVISION_REQUESTED: <AlertCircle className="h-4 w-4" />,
  COMPLETED: <CheckCircle className="h-4 w-4" />,
  CANCELLED: <XCircle className="h-4 w-4" />,
};

const priorityLabels: Record<number, string> = {
  1: "Low",
  2: "Medium",
  3: "High",
};

const priorityColors: Record<number, string> = {
  1: "bg-gray-100 text-gray-800",
  2: "bg-yellow-100 text-yellow-800",
  3: "bg-red-100 text-red-800",
};

export default function AdminRequestDetailPage() {
  const params = useParams();
  const requestId = params.id as string;
  const [comment, setComment] = useState("");
  const [commentFiles, setCommentFiles] = useState<UploadedFile[]>([]);

  const utils = trpc.useUtils();

  const { data: request, isLoading } = trpc.request.getById.useQuery({ id: requestId });

  const addComment = trpc.request.addComment.useMutation({
    onSuccess: () => {
      setComment("");
      setCommentFiles([]);
      utils.request.getById.invalidate({ id: requestId });
      toast.success("Message Sent", {
        description: "Your message has been sent.",
      });
    },
    onError: (error: unknown) => {
      showError(error, "Failed to send message");
    },
  });

  const handleSendComment = () => {
    if (!comment.trim() && commentFiles.length === 0) return;
    addComment.mutate({ 
      requestId, 
      content: comment || "(Attachment)",
      files: commentFiles.map((f) => f.url),
    });
  };

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
      <div className="flex items-center gap-4">
        <Link href="/admin/requests">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{request.title}</h1>
          <p className="text-muted-foreground">Request ID: {request.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${statusColors[request.status]} flex items-center gap-1`}>
            {statusIcons[request.status]}
            {request.status.replace("_", " ")}
          </Badge>
          <Badge className={priorityColors[request.priority]}>
            {priorityLabels[request.priority]} Priority
          </Badge>
          <Badge variant="outline" className="font-semibold">
            💳 {(request as any).creditCost} {(request as any).creditCost === 1 ? 'credit' : 'credits'}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{request.description}</p>
            </CardContent>
          </Card>

          {/* Attachments */}
          {request.attachments && request.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Attachments ({request.attachments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {request.attachments.map((url: string, index: number) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 border rounded hover:bg-muted/50 transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      <span className="truncate">Attachment {index + 1}</span>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Service-Specific Q&A Responses */}
          {(request as any).attributeResponses && Array.isArray((request as any).attributeResponses) && (request as any).attributeResponses.length > 0 && (
            <AttributeResponsesDisplay responses={(request as any).attributeResponses} />
          )}

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <CardDescription>
                Communicate with client and provider
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {request.comments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No messages yet
                </p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {request.comments.map((comment: { id: string; type: string; content: string; createdAt: Date; user: { name: string | null; email: string | null; image: string | null }; files: string[] }) => (
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
                            {getInitials(comment.user.name || comment.user.email || "")}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {comment.type === "SYSTEM"
                              ? "System"
                              : comment.user.name || comment.user.email}
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
                    placeholder="Send a message to client or provider..."
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
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Client
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{request.client.name || "No name"}</p>
                <p className="text-sm text-muted-foreground">{request.client.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Provider Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Provider
              </CardTitle>
            </CardHeader>
            <CardContent>
              {request.provider ? (
                <div className="space-y-2">
                  <p className="font-medium">{request.provider.name || "No name"}</p>
                  <p className="text-sm text-muted-foreground">{request.provider.email}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">Not assigned yet</p>
              )}
            </CardContent>
          </Card>

          {/* Service Type */}
          <Card>
            <CardHeader>
              <CardTitle>Service Type</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{request.serviceType.name}</p>
              {request.serviceType.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {request.serviceType.description}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Updated</span>
                  <span>{new Date(request.updatedAt).toLocaleDateString()}</span>
                </div>
                {request.estimatedDelivery && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. Delivery</span>
                    <span>{new Date(request.estimatedDelivery).toLocaleDateString()}</span>
                  </div>
                )}
                {request.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completed</span>
                    <span>{new Date(request.completedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Revisions */}
          <Card>
            <CardHeader>
              <CardTitle>Revisions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {request.currentRevisionCount} / {request.totalRevisions}
                </p>
                <p className="text-sm text-muted-foreground">revisions used</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
