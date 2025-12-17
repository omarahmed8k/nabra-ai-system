"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { FileUpload, InlineFileUpload, type UploadedFile } from "@/components/ui/file-upload";
import { AttributeResponsesDisplay } from "@/components/client/attribute-responses-display";
import { RequestHeader } from "@/components/requests/request-header";
import { RequestSidebar } from "@/components/requests/request-sidebar";
import { trpc } from "@/lib/trpc/client";
import { showError } from "@/lib/error-handler";
import { formatDateTime, getInitials } from "@/lib/utils";
import { Send, Upload, Play, CheckCircle } from "lucide-react";

export default function ProviderRequestDetailPage() {
  const params = useParams();
  const t = useTranslations("provider.requestDetail");
  const locale = useLocale();
  const requestId = params.id as string;
  const [comment, setComment] = useState("");
  const [commentFiles, setCommentFiles] = useState<UploadedFile[]>([]);
  const [deliverable, setDeliverable] = useState("");
  const [deliverableFiles, setDeliverableFiles] = useState<UploadedFile[]>([]);
  const [estimatedHours, setEstimatedHours] = useState<string>("24");

  const utils = trpc.useUtils();

  const { data: request, isLoading } = trpc.request.getById.useQuery({
    id: requestId,
  });

  const addComment = trpc.request.addComment.useMutation({
    onSuccess: () => {
      setComment("");
      utils.request.getById.invalidate({ id: requestId });
      toast.success(t("toast.messageSent"), {
        description: t("toast.messageSuccess"),
      });
    },
    onError: (error) => {
      showError(error, t("toast.messageFailed"));
    },
  });

  const startWork = trpc.provider.startWork.useMutation({
    onSuccess: () => {
      utils.request.getById.invalidate({ id: requestId });
      toast.success(t("toast.workStarted"), {
        description: t("toast.workStartedDesc"),
      });
    },
    onError: (error) => {
      showError(error, t("toast.startWorkFailed"));
    },
  });

  const deliverWork = trpc.provider.deliverWork.useMutation({
    onSuccess: () => {
      setDeliverable("");
      utils.request.getById.invalidate({ id: requestId });
      toast.success(t("toast.deliverableSubmitted"), {
        description: t("toast.deliverableSubmittedDesc"),
      });
    },
    onError: (error) => {
      showError(error, t("toast.deliverFailed"));
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
    const hours = Number.parseInt(estimatedHours, 10);
    if (Number.isNaN(hours) || hours < 1 || hours > 720) {
      toast.error(t("startWork.invalidInput"), {
        description: t("startWork.invalidInputDesc"),
      });
      return;
    }
    startWork.mutate({
      requestId,
      estimatedDeliveryHours: hours,
    });
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
        <h2 className="text-2xl font-bold">{t("notFound")}</h2>
        <Link href="/provider/my-requests">
          <Button className="mt-4">{t("backToMyRequests")}</Button>
        </Link>
      </div>
    );
  }

  const canStart = request.status === "PENDING";
  const canDeliver = request.status === "IN_PROGRESS" || request.status === "REVISION_REQUESTED";

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
        backUrl="/provider/my-requests"
        backLabel={t("backToMyRequests")}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>{t("description")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="whitespace-pre-wrap">{request.description}</p>

              {/* Request Attachments */}
              {request.attachments && request.attachments.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">
                    {t("attachments", { count: request.attachments.length })}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {request.attachments.map((file: string, index: number) => {
                      const fileName = file.split("/").pop() || `Attachment ${index + 1}`;
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
          {(request as any).attributeResponses &&
            Array.isArray((request as any).attributeResponses) &&
            (request as any).attributeResponses.length > 0 && (
              <AttributeResponsesDisplay responses={(request as any).attributeResponses} />
            )}

          {/* Action Card */}
          {canStart && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-800">{t("startWork.title")}</CardTitle>
                <CardDescription className="text-blue-700">
                  {t("startWork.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="estimatedHours" className="text-sm font-medium text-blue-800">
                    Estimated Delivery Time
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      id="estimatedHours"
                      type="number"
                      min="1"
                      max="720"
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(e.target.value)}
                      className="flex text-black h-10 w-24 rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="24"
                    />
                    <span className="text-sm text-blue-700">hours</span>
                    <span className="text-xs text-blue-600 flex items-center gap-2">
                      (
                      {(() => {
                        const hours = Number.parseInt(estimatedHours, 10);
                        if (Number.isNaN(hours) || hours <= 0) {
                          return "Enter hours";
                        }
                        if (hours < 24) {
                          return `${hours} hour${hours === 1 ? "" : "s"}`;
                        }
                        const days = Math.round(hours / 24);
                        return `~${days} day${days === 1 ? "" : "s"}`;
                      })()}
                      )
                    </span>
                  </div>
                  <p className="text-xs text-blue-600">
                    Estimate between 1-720 hours (up to 30 days)
                  </p>
                </div>
                <Button
                  onClick={handleStartWork}
                  disabled={startWork.isPending}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  {startWork.isPending ? "Starting..." : "Start Work"}
                </Button>
              </CardContent>
            </Card>
          )}

          {canDeliver && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800">{t("submitDeliverable.title")}</CardTitle>
                <CardDescription className="text-green-700">
                  {t("submitDeliverable.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    placeholder={t("submitDeliverable.placeholder")}
                    value={deliverable}
                    onChange={(e) => setDeliverable(e.target.value)}
                    rows={4}
                  />
                  {deliverable.length > 0 && deliverable.length < 5 && (
                    <p className="text-sm text-amber-600">
                      {t("submitDeliverable.minCharactersWarning", {
                        remaining: 5 - deliverable.length,
                      })}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-800">
                    {t("submitDeliverable.attachFiles")}
                  </p>
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
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {deliverWork.isPending
                    ? t("submitDeliverable.submitting")
                    : t("submitDeliverable.button")}
                </Button>
              </CardContent>
            </Card>
          )}

          {request.status === "DELIVERED" && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-800">{t("awaitingReview.title")}</CardTitle>
                <CardDescription className="text-yellow-700">
                  {t("awaitingReview.description")}
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {request.status === "COMPLETED" && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-green-800">{t("completed.title")}</CardTitle>
                </div>
                <CardDescription className="text-green-700">
                  {t("completed.description")}
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Chat */}
          <Card>
            <CardHeader>
              <CardTitle>{t("messages.title")}</CardTitle>
              <CardDescription>{t("messages.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {request.comments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t("messages.noMessages")}</p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {request.comments.map(
                    (comment: {
                      id: string;
                      content: string;
                      type: string;
                      createdAt: Date;
                      files?: string[];
                      user: { name: string | null; image: string | null };
                    }) => (
                      <div
                        key={comment.id}
                        className={`flex gap-3 ${
                          comment.type === "SYSTEM" ? "bg-muted/50 p-3 rounded-lg" : ""
                        }`}
                      >
                        {comment.type !== "SYSTEM" && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.user.image || ""} />
                            <AvatarFallback>{getInitials(comment.user.name || "")}</AvatarFallback>
                          </Avatar>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {comment.type === "SYSTEM" ? t("messages.system") : comment.user.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(comment.createdAt, locale)}
                            </span>
                            {comment.type === "DELIVERABLE" && (
                              <Badge variant="secondary">{t("messages.deliverable")}</Badge>
                            )}
                          </div>
                          <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
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
                                  {t("messages.attachment", { number: i + 1 })}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              <Separator />

              {request.status !== "COMPLETED" && (
                <div className="space-y-3">
                  <InlineFileUpload
                    onFilesChange={setCommentFiles}
                    maxFiles={3}
                    disabled={addComment.isPending}
                  />
                  <div className="flex gap-2">
                    <Textarea
                      placeholder={t("messages.placeholder")}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={2}
                    />
                    <Button
                      size="icon"
                      onClick={handleSendComment}
                      disabled={
                        (!comment.trim() && commentFiles.length === 0) || addComment.isPending
                      }
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {request.status === "COMPLETED" && (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm">{t("messages.requestCompleted")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <RequestSidebar
            client={request.client}
            provider={null}
            serviceTypeName={request.serviceType.name}
            serviceTypeIcon={request.serviceType.icon || undefined}
            createdAt={request.createdAt}
            updatedAt={request.updatedAt}
            estimatedDelivery={request.estimatedDelivery}
            completedAt={request.completedAt}
            currentRevisionCount={request.currentRevisionCount}
            totalRevisions={request.totalRevisions}
          />

          {/* Rating */}
          {(request as any).rating && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-amber-800">{t("rating.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span
                        key={i}
                        className={`text-2xl ${
                          i < (request as any).rating.rating ? "text-amber-500" : "text-gray-300"
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-xl font-bold text-amber-800">
                    {(request as any).rating.rating}/5
                  </span>
                </div>
                {(request as any).rating.reviewText && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t("rating.review")}</p>
                    <p className="text-sm text-black whitespace-pre-wrap">
                      {(request as any).rating.reviewText}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("rating.ratedOn", {
                      date: formatDateTime((request as any).rating.createdAt, locale),
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
