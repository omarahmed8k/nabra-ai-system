"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { InlineFileUpload, type UploadedFile } from "@/components/ui/file-upload";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { AttributeResponsesDisplay } from "@/components/client/attribute-responses-display";
import { trpc } from "@/lib/trpc/client";
import { showError } from "@/lib/error-handler";
import {
  formatDate,
  formatDateTime,
  getPriorityLabel,
  getPriorityColor,
  getInitials,
} from "@/lib/utils";
import { ArrowLeft, Clock, User, Send } from "lucide-react";

export default function AvailableJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;
  const [comment, setComment] = useState("");
  const [commentFiles, setCommentFiles] = useState<UploadedFile[]>([]);

  const utils = trpc.useUtils();

  const { data: request, isLoading } = trpc.request.getById.useQuery({
    id: requestId,
  });

  const addComment = trpc.request.addComment.useMutation({
    onSuccess: () => {
      setComment("");
      setCommentFiles([]);
      utils.request.getById.invalidate({ id: requestId });
      toast.success("Message Sent", {
        description: "Your message has been sent to the client.",
      });
    },
    onError: (error: unknown) => {
      showError(error, "Failed to send message");
    },
  });

  const claimRequest = trpc.provider.claimRequest.useMutation({
    onSuccess: () => {
      router.push(`/provider/requests/${requestId}`);
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
        <div className="lg:col-span-2 space-y-6">
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

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <CardDescription>
                Ask questions about this job before claiming
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {request.comments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No messages yet. Ask the client any questions!
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
                    placeholder="Ask the client a question..."
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
