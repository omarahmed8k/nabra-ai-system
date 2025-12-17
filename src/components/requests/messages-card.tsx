import { useRef, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { InlineFileUpload, type UploadedFile } from "@/components/ui/file-upload";
import { Send, Mic, Square } from "lucide-react";
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
    role?: string | null;
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
  readonly maskProviderNames?: boolean;
  readonly maskClientNames?: boolean;
}

export function MessagesCard({
  requestId,
  comments,
  title = "Messages",
  description = "Communicate with other parties",
  placeholder = "Type your message...",
  canSendMessages = true,
  maskProviderNames = false,
  maskClientNames = false,
}: MessagesCardProps) {
  const t = useTranslations("requests.messages");
  const tSidebar = useTranslations("requests.sidebar");
  const locale = useLocale();
  const [comment, setComment] = useState("");
  const [commentFiles, setCommentFiles] = useState<UploadedFile[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

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
    const hasContent = comment.trim().length > 0 || commentFiles.length > 0;
    if (!hasContent) return;
    addComment.mutate({
      requestId,
      content: comment || t("attachmentFallback"),
      files: commentFiles.map((f) => f.url),
    });
  };

  const uploadBlobAsFile = async (blob: Blob, filename: string, type: string) => {
    const formData = new FormData();
    const file = new File([blob], filename, { type });
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return {
      url: data.url as string,
      filename: data.filename as string,
      size: data.size as number,
      type: data.type as string,
    } satisfies UploadedFile;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        try {
          const uploaded = await uploadBlobAsFile(
            blob,
            `voice-note-${Date.now()}.webm`,
            "audio/webm"
          );
          setCommentFiles((prev) => [...prev, uploaded]);
          toast.success(t("messageSent"), { description: t("attachment") });
        } catch (e) {
          showError(e, t("messageFailed"));
        } finally {
          setIsRecording(false);
        }
      };
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = chunks;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) {
      showError(e, t("messageFailed"));
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  // Precompute send button disabled state
  const hasContentForSend = comment.trim().length > 0 || commentFiles.length > 0;
  const sendDisabled = !hasContentForSend || addComment.isPending;

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
            {comments.map((comment) => {
              const isSystem = comment.type === "SYSTEM";
              let displayName: string;
              if (isSystem) {
                displayName = t("system");
              } else if (maskProviderNames && comment.user?.role === "PROVIDER") {
                displayName = tSidebar("brandProviderName");
              } else if (maskClientNames && comment.user?.role === "CLIENT") {
                displayName = tSidebar("client");
              } else {
                displayName = comment.user.name || comment.user.email || "";
              }
              return (
                <div
                  key={comment.id}
                  className={`flex gap-3 ${
                    comment.type === "SYSTEM" ? "bg-muted/50 p-3 rounded-lg" : ""
                  }`}
                >
                  {!isSystem && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.user.image || ""} />
                      <AvatarFallback>
                        {getInitials(comment.user.name || comment.user.email || "")}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{displayName}</span>
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
              );
            })}
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
                <Button
                  type="button"
                  variant={isRecording ? "destructive" : "outline"}
                  size="icon"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={addComment.isPending}
                  title={t("recordVoice")}
                >
                  {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Textarea
                  placeholder={placeholder || t("placeholder")}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                />
                <Button size="icon" onClick={handleSendComment} disabled={sendDisabled}>
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
