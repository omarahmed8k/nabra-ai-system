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

interface CreditBreakdownData {
  hasCreditBreakdown: boolean;
  creditBreakdown?: string;
  base: number;
  prio: number;
  paidRevisionTotal: number;
  hasPaidRevisions: boolean;
  paidRevisionMultiplier: number;
  canDeriveMultiplier: boolean;
  paidUnit: number;
  showFreeRevision: boolean;
}

function calculateCreditBreakdown(
  creditCost: number,
  baseCreditCost?: number,
  priorityCreditCost?: number,
  paidRevisionCost?: number,
  isRevision?: boolean,
  revisionType?: string | null
): CreditBreakdownData {
  const hasCreditBreakdown = baseCreditCost !== undefined && priorityCreditCost !== undefined;
  const base = baseCreditCost ?? 0;
  const prio = priorityCreditCost ?? 0;
  const paidUnit = paidRevisionCost ?? 0;
  const paidRevisionTotal = hasCreditBreakdown ? Math.max(0, creditCost - base - prio) : 0;
  const hasPaidRevisions = paidRevisionTotal > 0;
  const canDeriveMultiplier = paidUnit > 0;
  const paidRevisionMultiplier = canDeriveMultiplier ? Math.floor(paidRevisionTotal / paidUnit) : 0;
  const showFreeRevision = !hasPaidRevisions && isRevision === true && revisionType === "free";

  let creditBreakdown: string | undefined;
  if (hasCreditBreakdown) {
    const revisionInfo = getRevisionInfo(
      hasPaidRevisions,
      canDeriveMultiplier,
      paidRevisionMultiplier,
      paidRevisionTotal,
      paidUnit,
      showFreeRevision
    );
    creditBreakdown = `Base: ${baseCreditCost} + Priority: ${priorityCreditCost}${revisionInfo}`;
  }

  return {
    hasCreditBreakdown,
    creditBreakdown,
    base,
    prio,
    paidRevisionTotal,
    hasPaidRevisions,
    paidRevisionMultiplier,
    canDeriveMultiplier,
    paidUnit,
    showFreeRevision,
  };
}

function getRevisionInfo(
  hasPaidRevisions: boolean,
  canDeriveMultiplier: boolean,
  paidRevisionMultiplier: number,
  paidRevisionTotal: number,
  paidUnit: number,
  showFreeRevision: boolean
): string {
  if (hasPaidRevisions) {
    const canShowMultiplier =
      canDeriveMultiplier && paidRevisionMultiplier >= 1 && paidRevisionTotal % paidUnit === 0;
    return canShowMultiplier
      ? ` + Revisions: +${paidUnit} x ${paidRevisionMultiplier}`
      : ` + Revisions: +${paidRevisionTotal}`;
  }
  return showFreeRevision ? " + Free Revision" : "";
}

function RevisionCostDisplay({
  canDeriveMultiplier,
  paidRevisionMultiplier,
  paidRevisionTotal,
  paidUnit,
}: {
  readonly canDeriveMultiplier: boolean;
  readonly paidRevisionMultiplier: number;
  readonly paidRevisionTotal: number;
  readonly paidUnit: number;
}) {
  const canShowMultiplier =
    canDeriveMultiplier && paidRevisionMultiplier >= 1 && paidRevisionTotal % paidUnit === 0;

  if (canShowMultiplier) {
    return (
      <>
        +{paidUnit} {paidUnit === 1 ? "credit" : "credits"} x {paidRevisionMultiplier}
      </>
    );
  }

  return (
    <>
      +{paidRevisionTotal} {paidRevisionTotal === 1 ? "credit" : "credits"}
    </>
  );
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
  const breakdown = calculateCreditBreakdown(
    creditCost,
    baseCreditCost,
    priorityCreditCost,
    paidRevisionCost,
    isRevision,
    revisionType
  );

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
            <Badge variant="outline" className="font-semibold" title={breakdown.creditBreakdown}>
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
      {breakdown.hasCreditBreakdown && (
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
            {breakdown.hasPaidRevisions && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Revision Cost:</span>
                <span className="font-medium">
                  <RevisionCostDisplay
                    canDeriveMultiplier={breakdown.canDeriveMultiplier}
                    paidRevisionMultiplier={breakdown.paidRevisionMultiplier}
                    paidRevisionTotal={breakdown.paidRevisionTotal}
                    paidUnit={breakdown.paidUnit}
                  />
                </span>
              </div>
            )}
            {breakdown.showFreeRevision && (
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
