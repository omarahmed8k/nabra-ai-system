import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

interface EmptyRequestsStateProps {
  readonly title?: string;
  readonly description?: string;
  readonly actionLabel?: string;
  readonly actionHref?: string;
}

export function EmptyRequestsState({
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyRequestsStateProps) {
  const t = useTranslations("requests.empty");

  return (
    <div className="text-center py-12 text-muted-foreground">
      <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
      <p className="text-lg font-medium">{title || t("title")}</p>
      <p className="text-sm">{description || t("description")}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <Button className="mt-4">{actionLabel}</Button>
        </Link>
      )}
    </div>
  );
}
