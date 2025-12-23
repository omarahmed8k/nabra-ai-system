"use client";

import { useTranslations } from "next-intl";
import type { ServiceAttribute, AttributeResponse } from "@/types/service-attributes";
import { calculateAttributeCreditBreakdown } from "@/lib/attribute-validation";

export function AttributeCostBreakdown({
  serviceAttributes,
  responses,
}: {
  readonly serviceAttributes: ServiceAttribute[];
  readonly responses: AttributeResponse[];
}) {
  const t = useTranslations("requests.attributes");

  const items = calculateAttributeCreditBreakdown(serviceAttributes || [], responses || []);
  const hasCosts = items.length > 0;

  if (!hasCosts) {
    return (
      <div className="p-4 bg-muted/50 rounded-lg border">
        <h3 className="font-semibold mb-2 text-sm">{t("costBreakdown")}</h3>
        <p className="text-sm text-muted-foreground">{t("noCosts")}</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-muted/50 rounded-lg border">
      <h3 className="font-semibold mb-2 text-sm">{t("costBreakdown")}</h3>
      <div className="space-y-2 text-sm">
        {items.map((item, idx) => (
          <div key={`${item.question}-${idx}`} className="flex justify-between">
            <span className="text-muted-foreground">{item.question}</span>
            <span className="font-medium">
              +{item.cost} {item.cost === 1 ? t("credit") : t("credits")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
