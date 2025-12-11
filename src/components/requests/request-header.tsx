import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { getStatusColor, getPriorityLabel, getPriorityColor, formatDate } from "@/lib/utils";

interface RequestHeaderProps {
  readonly title: string;
  readonly status: string;
  readonly priority: number;
  readonly creditCost: number;
  readonly baseCreditCost?: number;
  readonly priorityCreditCost?: number;
  readonly isRevision?: boolean;
  readonly revisionType?: string | null;
  readonly paidRevisionCost?: number;
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
  baseCreditCost,
  priorityCreditCost,
  isRevision,
  revisionType,
  paidRevisionCost,
  serviceTypeName,
  serviceTypeIcon,
  createdAt,
  backUrl,
  backLabel = "Back",
  actions,
}: RequestHeaderProps) {
  // Build credit breakdown tooltip
  const hasCreditBreakdown = baseCreditCost !== undefined && priorityCreditCost !== undefined;

  // Normalize values for simpler math
  const base = baseCreditCost ?? 0;
  const prio = priorityCreditCost ?? 0;
  const paidUnit = paidRevisionCost ?? 0;

  // Derive total paid revision credits from persisted totals
  const paidRevisionTotal = hasCreditBreakdown ? Math.max(0, creditCost - base - prio) : 0;
  const hasPaidRevisions = paidRevisionTotal > 0;
  const canDeriveMultiplier = paidUnit > 0;
  const paidRevisionMultiplier = canDeriveMultiplier ? Math.floor(paidRevisionTotal / paidUnit) : 0;

  let creditBreakdown: string | undefined;
  if (hasCreditBreakdown) {
    let revisionInfo = "";
    if (hasPaidRevisions) {
      if (
        canDeriveMultiplier &&
        paidRevisionMultiplier >= 1 &&
        paidRevisionTotal % paidUnit === 0
      ) {
        revisionInfo = ` + Revisions: +${paidUnit} x ${paidRevisionMultiplier}`;
      } else {
        revisionInfo = ` + Revisions: +${paidRevisionTotal}`;
      }
    } else if (isRevision && revisionType === "free") {
      revisionInfo = " + Free Revision";
    }
    creditBreakdown = `Base: ${baseCreditCost} + Priority: ${priorityCreditCost}${revisionInfo}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <Link href={backUrl}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{title}</h1>
            <Badge variant={null} className={getStatusColor(status)}>
              {status.replace("_", " ")}
            </Badge>
            <Badge variant={null} className={getPriorityColor(priority)}>
              {getPriorityLabel(priority)} Priority
            </Badge>
            <Badge variant="outline" className="font-semibold" title={creditBreakdown}>
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

      {/* Credit Cost Breakdown */}
      {hasCreditBreakdown && (
        <div className="p-4 bg-muted/50 rounded-lg border">
          <h3 className="font-semibold mb-2 text-sm">Credit Cost Breakdown:</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base Cost:</span>
              <span className="font-medium">
                {baseCreditCost} {baseCreditCost === 1 ? "credit" : "credits"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Priority ({getPriorityLabel(priority)}):
              </span>
              <span className="font-medium">
                +{priorityCreditCost} {priorityCreditCost === 1 ? "credit" : "credits"}
              </span>
            </div>
            {hasPaidRevisions && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Revision Cost:</span>
                <span className="font-medium">
                  {canDeriveMultiplier &&
                  paidRevisionMultiplier >= 1 &&
                  paidRevisionTotal % paidUnit === 0 ? (
                    <>
                      +{paidUnit} {paidUnit === 1 ? "credit" : "credits"} x {paidRevisionMultiplier}
                    </>
                  ) : (
                    <>
                      +{paidRevisionTotal} {paidRevisionTotal === 1 ? "credit" : "credits"}
                    </>
                  )}
                </span>
              </div>
            )}
            {isRevision && revisionType === "free" && (
              <div className="flex justify-between text-green-600">
                <span>Free Revision:</span>
                <span className="font-medium">No additional cost</span>
              </div>
            )}
            <div className="pt-2 mt-2 border-t flex justify-between font-semibold">
              <span>Total:</span>
              <span>
                {creditCost} {creditCost === 1 ? "credit" : "credits"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
