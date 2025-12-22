"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations, useLocale } from "next-intl";
import { resolveLocalizedText } from "@/lib/i18n";
import type { ServiceAttribute, AttributeResponse } from "@/types/service-attributes";

interface ServiceAttributesFormProps {
  readonly attributes: ServiceAttribute[];
  readonly responses: AttributeResponse[];
  readonly onChange: (responses: AttributeResponse[]) => void;
  readonly disabled?: boolean;
}

export function ServiceAttributesForm({
  attributes,
  responses,
  onChange,
  disabled = false,
}: ServiceAttributesFormProps) {
  const t = useTranslations("client.newRequest.serviceQuestions");
  const locale = useLocale();

  if (!attributes || attributes.length === 0) {
    return null;
  }

  const updateResponse = (question: string, answer: string | string[]) => {
    const existingIndex = responses.findIndex((r) => r.question === question);
    const newResponses = [...responses];

    if (existingIndex >= 0) {
      newResponses[existingIndex] = { question, answer };
    } else {
      newResponses.push({ question, answer });
    }

    onChange(newResponses);
  };

  const getResponse = (question: string): string | string[] => {
    const response = responses.find((r) => r.question === question);
    return response?.answer || "";
  };

  const toggleMultiselectOption = (question: string, option: string) => {
    const currentAnswer = getResponse(question);
    const currentArray = Array.isArray(currentAnswer) ? currentAnswer : [];

    const newArray = currentArray.includes(option)
      ? currentArray.filter((o) => o !== option)
      : [...currentArray, option];

    updateResponse(question, newArray);
  };

  const getCreditCostLabel = (attr: ServiceAttribute): string | null => {
    if (!attr.creditImpact || attr.creditImpact === 0) return null;

    const unit = attr.type === "select" ? "selection" : "unit";

    if (attr.type === "number" && attr.includedQuantity !== undefined) {
      return t("extraCostWithIncluded", {
        cost: attr.creditImpact,
        unit,
        included: attr.includedQuantity,
      });
    }

    return t("extraCost", {
      cost: attr.creditImpact,
      unit,
    });
  };

  return (
    <div className="space-y-6">
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">{t("title")}</h3>
        <p className="text-sm text-muted-foreground mb-6">{t("description")}</p>

        <div className="space-y-6">
          {attributes.map((attr, index) => {
            const creditCostLabel = getCreditCostLabel(attr);

            return (
              <div key={`${attr.question}-${index}`} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`attr-${index}`} className="flex items-center gap-1">
                    {resolveLocalizedText((attr as any).questionI18n, locale, attr.question)}
                    {attr.required && <span className="text-destructive">*</span>}
                  </Label>
                  {creditCostLabel && (
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                      {creditCostLabel}
                    </span>
                  )}
                </div>

                {(attr.helpText || (attr as any).helpTextI18n) && (
                  <p className="text-xs text-muted-foreground">
                    {resolveLocalizedText((attr as any).helpTextI18n, locale, attr.helpText)}
                  </p>
                )}

                {/* Text Input */}
                {attr.type === "text" && (
                  <Input
                    id={`attr-${index}`}
                    placeholder={resolveLocalizedText(
                      (attr as any).placeholderI18n,
                      locale,
                      attr.placeholder
                    )}
                    value={(getResponse(attr.question) as string) || ""}
                    onChange={(e) => updateResponse(attr.question, e.target.value)}
                    required={attr.required}
                    disabled={disabled}
                  />
                )}

                {/* Textarea Input */}
                {attr.type === "textarea" && (
                  <Textarea
                    id={`attr-${index}`}
                    placeholder={resolveLocalizedText(
                      (attr as any).placeholderI18n,
                      locale,
                      attr.placeholder
                    )}
                    value={(getResponse(attr.question) as string) || ""}
                    onChange={(e) => updateResponse(attr.question, e.target.value)}
                    required={attr.required}
                    disabled={disabled}
                    rows={4}
                  />
                )}

                {/* Number Input */}
                {attr.type === "number" && (
                  <Input
                    id={`attr-${index}`}
                    type="number"
                    placeholder={resolveLocalizedText(
                      (attr as any).placeholderI18n,
                      locale,
                      attr.placeholder
                    )}
                    value={(getResponse(attr.question) as string) || ""}
                    onChange={(e) => updateResponse(attr.question, e.target.value)}
                    required={attr.required}
                    disabled={disabled}
                    min={attr.min}
                    max={attr.max}
                  />
                )}

                {/* Select Input */}
                {attr.type === "select" && (
                  <Select
                    value={(getResponse(attr.question) as string) || ""}
                    onValueChange={(value) => updateResponse(attr.question, value)}
                    disabled={disabled}
                    required={attr.required}
                  >
                    <SelectTrigger id={`attr-${index}`}>
                      <SelectValue placeholder={t("selectOption")} />
                    </SelectTrigger>
                    <SelectContent>
                      {attr.options?.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Multiselect Input */}
                {attr.type === "multiselect" && (
                  <div className="space-y-2 border rounded-md p-4">
                    {attr.options?.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${attr.question}-${option}`}
                          checked={
                            Array.isArray(getResponse(attr.question)) &&
                            (getResponse(attr.question) as string[]).includes(option)
                          }
                          onCheckedChange={() => toggleMultiselectOption(attr.question, option)}
                          disabled={disabled}
                        />
                        <label
                          htmlFor={`${attr.question}-${option}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
