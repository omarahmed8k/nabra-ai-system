import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDate, getStatusColor, getPriorityLabel, getPriorityColor } from "@/lib/utils";
import { Clock } from "lucide-react";

interface RequestCardProps {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly status: string;
  readonly priority?: number;
  readonly creditCost: number;
  readonly createdAt: Date;
  readonly serviceType: {
    name: string;
    icon?: string | null;
  };
  readonly client?: {
    name: string | null;
    email: string;
  };
  readonly provider?: {
    name: string | null;
    email?: string;
  } | null;
  readonly commentCount?: number;
  readonly href: string;
  readonly actions?: React.ReactNode;
  readonly variant?: "compact" | "detailed";
}

export function RequestCard({
  id,
  title,
  description,
  status,
  priority,
  creditCost,
  createdAt,
  serviceType,
  client,
  provider,
  commentCount,
  href,
  actions,
  variant = "compact",
}: RequestCardProps) {
  const content = (
    <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-medium truncate">{title}</h3>
          <Badge className={getStatusColor(status)}>
            {status.replace("_", " ")}
          </Badge>
          {priority && (
            <Badge className={getPriorityColor(priority)}>
              {getPriorityLabel(priority)}
            </Badge>
          )}
          {creditCost !== undefined && creditCost !== null && (
            <Badge variant="outline" className="font-semibold">
              💳 {creditCost} {creditCost === 1 ? "credit" : "credits"}
            </Badge>
          )}
          {provider === null && (
            <Badge variant="outline" className="text-orange-600 border-orange-300">
              Unassigned
            </Badge>
          )}
        </div>

        {variant === "detailed" && description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            {serviceType.icon && `${serviceType.icon} `}
            {serviceType.name}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {formatDate(createdAt)}
          </span>
          {client && (
            <span>
              <strong>Client:</strong> {client.name || client.email}
            </span>
          )}
          {provider && (
            <span>
              <strong>Provider:</strong> {provider.name || provider.email}
            </span>
          )}
          {commentCount !== undefined && (
            <span>{commentCount} messages</span>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2 ml-4">
          {actions}
        </div>
      )}
    </div>
  );

  if (actions) {
    return <div key={id}>{content}</div>;
  }

  return (
    <Link key={id} href={href} className="block">
      {content}
    </Link>
  );
}
