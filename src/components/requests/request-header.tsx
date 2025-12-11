import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import {
  getStatusColor,
  getPriorityLabel,
  getPriorityColor,
  formatDate,
} from "@/lib/utils";

interface RequestHeaderProps {
  readonly title: string;
  readonly status: string;
  readonly priority: number;
  readonly creditCost: number;
  readonly serviceTypeName: string;
  readonly serviceTypeIcon?: string;
  readonly createdAt: Date;
  readonly backUrl: string;
  readonly backLabel?: string;
  readonly actions?: React.ReactNode;
}

export function RequestHeader({
  title,
  status,
  priority,
  creditCost,
  serviceTypeName,
  serviceTypeIcon,
  createdAt,
  backUrl,
  backLabel = "Back",
  actions,
}: RequestHeaderProps) {
  return (
    <div className="flex items-start gap-4">
      <Link href={backUrl}>
        <Button variant="ghost" size="icon">
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </Link>
      <div className="flex-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold">{title}</h1>
          <Badge className={getStatusColor(status)}>
            {status.replace("_", " ")}
          </Badge>
          <Badge className={getPriorityColor(priority)}>
            {getPriorityLabel(priority)} Priority
          </Badge>
          <Badge variant="outline" className="font-semibold">
            💳 {creditCost} {creditCost === 1 ? "credit" : "credits"}
          </Badge>
        </div>
        <p className="text-muted-foreground mt-1">
          {serviceTypeIcon && `${serviceTypeIcon} `}
          {serviceTypeName} • Created {formatDate(createdAt)}
        </p>
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
