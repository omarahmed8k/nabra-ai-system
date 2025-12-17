"use client";

import { useLocale, useTranslations } from "next-intl";

interface TooltipPayload {
  name: string;
  value: number | string;
  payload?: Record<string, any>;
  color?: string;
  fill?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  labelKey?: string;
  valueFormatter?: (value: any) => string;
  statusTranslationKey?: (status: string) => string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  labelKey,
  valueFormatter,
  statusTranslationKey,
}: ChartTooltipProps) {
  const locale = useLocale();
  const t = useTranslations();

  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const isRTL = locale === "ar";

  return (
    <div
      className={`rounded-lg border bg-background p-3 shadow-lg ${
        isRTL ? "text-right" : "text-left"
      }`}
    >
      {label && labelKey && (
        <p className="text-sm font-medium text-muted-foreground mb-1">
          {t(labelKey)}: {label}
        </p>
      )}

      {payload.map((entry, index) => {
        const displayValue = valueFormatter ? valueFormatter(entry.value) : entry.value;

        // Check if this is a status field that needs translation
        let displayLabel = entry.name;
        if (statusTranslationKey && entry.payload?.status) {
          displayLabel = statusTranslationKey(entry.payload.status);
        }

        const color = entry.color || entry.fill || "#8884d8";

        return (
          <p key={`payload-${index}`} className="text-sm font-medium">
            <span className={`inline-block ${isRTL ? "ml-2" : "mr-2"}`}>
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
            </span>
            {displayLabel}: {displayValue}
          </p>
        );
      })}
    </div>
  );
}

export default ChartTooltip;
