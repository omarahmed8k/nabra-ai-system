import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";

interface RequestDescriptionProps {
  readonly description: string;
  readonly attachments?: string[];
}

export function RequestDescription({ description, attachments }: RequestDescriptionProps) {
  const t = useTranslations("requests.description");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="whitespace-pre-wrap">{description}</p>

        {/* Request Attachments */}
        {attachments && attachments.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">
              {t("attachments", { count: attachments.length })}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {attachments.map((file: string, index: number) => {
                const fileName =
                  file.split("/").pop() || t("attachmentFallback", { number: index + 1 });
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
                        <img src={file} alt={fileName} className="w-full h-full object-cover" />
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
  );
}
