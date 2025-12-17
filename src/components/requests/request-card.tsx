import { Link } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import {
  formatDate,
  getStatusColor,
  getPriorityLabel,
  getPriorityColor,
  getStatusLabel,
} from "@/lib/utils";
import { Clock } from "lucide-react";

interface RequestCardProps {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly status: string;
  readonly priority?: number;
  readonly creditCost: number;
  readonly baseCreditCost?: number;
  readonly priorityCreditCost?: number;
  readonly isRevision?: boolean;
  readonly revisionType?: string | null;
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
  baseCreditCost,
  priorityCreditCost,
  isRevision,
  revisionType,
  createdAt,
  serviceType,
  client,
  provider,
  commentCount,
  href,
  actions,
  variant = "compact",
}: RequestCardProps) {
  const hasCreditBreakdown = baseCreditCost !== undefined && priorityCreditCost !== undefined;

  const content = (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg border hover:bg-muted/50 transition-colors gap-3 sm:gap-4">
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <h3 className="font-medium text-sm sm:text-base truncate flex-1 min-w-0">{title}</h3>
          <Badge variant={null} className={`${getStatusColor(status)} text-xs`}>
            {getStatusLabel(status)}
          </Badge>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {priority && (
            <Badge variant={null} className={`${getPriorityColor(priority)} text-xs`}>
              {getPriorityLabel(priority)}
            </Badge>
          )}
          {creditCost !== undefined && creditCost !== null && (
            <Badge variant="outline" className="font-semibold text-xs flex items-center gap-1">
              💳 {creditCost}
              {hasCreditBreakdown && (
                <span className="text-muted-foreground text-[10px] sm:text-xs">
                  ({baseCreditCost}+{priorityCreditCost})
                </span>
              )}
            </Badge>
          )}
          {isRevision && revisionType && (
            <Badge variant={revisionType === "free" ? "secondary" : "default"} className="text-xs">
              {revisionType === "free" ? "🔄 Free" : "💰 Paid"}
            </Badge>
          )}
          {provider === null && (
            <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">
              Unassigned
            </Badge>
          )}
        </div>

        {variant === "detailed" && description && (
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{description}</p>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            {serviceType.icon && `${serviceType.icon} `}
            <span className="truncate">{serviceType.name}</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            {formatDate(createdAt)}
          </span>
          {client && (
            <span className="truncate">
              <strong>Client:</strong> {client.name || client.email}
            </span>
          )}
          {provider && (
            <span className="truncate">
              <strong>Provider:</strong> {provider.name || provider.email}
            </span>
          )}
          {commentCount !== undefined && <span>{commentCount} messages</span>}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2 sm:ms-4 self-start sm:self-center">{actions}</div>
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
