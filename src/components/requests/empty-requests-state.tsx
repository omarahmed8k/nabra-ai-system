import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmptyRequestsStateProps {
  readonly title?: string;
  readonly description?: string;
  readonly actionLabel?: string;
  readonly actionHref?: string;
}

export function EmptyRequestsState({
  title = "No requests yet",
  description = "There are no requests to display",
  actionLabel,
  actionHref,
}: EmptyRequestsStateProps) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
      <p className="text-lg font-medium">{title}</p>
      <p className="text-sm">{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <Button className="mt-4">{actionLabel}</Button>
        </Link>
      )}
    </div>
  );
}
