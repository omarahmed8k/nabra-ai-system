import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { InlineFileUpload, type UploadedFile } from "@/components/ui/file-upload";
import { Send } from "lucide-react";
import { formatDateTime, getInitials } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";
import { showError } from "@/lib/error-handler";
import { useTranslations, useLocale } from "next-intl";

interface Comment {
  id: string;
  type: string;
  content: string;
  createdAt: Date;
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
  files: string[];
}

interface MessagesCardProps {
  readonly requestId: string;
  readonly comments: Comment[];
  readonly title?: string;
  readonly description?: string;
  readonly placeholder?: string;
  readonly canSendMessages?: boolean;
}

export function MessagesCard({
  requestId,
  comments,
  title = "Messages",
  description = "Communicate with other parties",
  placeholder = "Type your message...",
  canSendMessages = true,
}: MessagesCardProps) {
  const t = useTranslations("requests.messages");
  const locale = useLocale();
  const [comment, setComment] = useState("");
  const [commentFiles, setCommentFiles] = useState<UploadedFile[]>([]);

  const utils = trpc.useUtils();

  const addComment = trpc.request.addComment.useMutation({
    onSuccess: () => {
      setComment("");
      setCommentFiles([]);
      utils.request.getById.invalidate({ id: requestId });
      toast.success(t("messageSent"), {
        description: t("messageSuccess"),
      });
    },
    onError: (error: unknown) => {
      showError(error, t("messageFailed"));
    },
  });

  const handleSendComment = () => {
    if (!comment.trim() && commentFiles.length === 0) return;
    addComment.mutate({
      requestId,
      content: comment || t("attachmentFallback"),
      files: commentFiles.map((f) => f.url),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || t("title")}</CardTitle>
        <CardDescription>{description || t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{t("noMessages")}</p>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className={`flex gap-3 ${
                  comment.type === "SYSTEM" ? "bg-muted/50 p-3 rounded-lg" : ""
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
                        ? t("system")
                        : comment.user.name || comment.user.email}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(comment.createdAt, locale)}
                    </span>
                    {comment.type === "DELIVERABLE" && (
                      <Badge variant="secondary">{t("deliverable")}</Badge>
                    )}
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
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
                          {t("attachment", { number: i + 1 })}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {canSendMessages && (
          <>
            <Separator />
            <div className="space-y-3">
              <InlineFileUpload
                onFilesChange={setCommentFiles}
                maxFiles={3}
                disabled={addComment.isPending}
              />
              <div className="flex gap-2">
                <Textarea
                  placeholder={placeholder || t("placeholder")}
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
          </>
        )}

        {!canSendMessages && (
          <>
            <Separator />
            <div className="text-center py-4 text-muted-foreground">
              <p className="text-sm">{t("requestCompleted")}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
