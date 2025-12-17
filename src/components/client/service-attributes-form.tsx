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
import { useTranslations } from "next-intl";
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

  return (
    <div className="space-y-6">
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">{t("title")}</h3>
        <p className="text-sm text-muted-foreground mb-6">{t("description")}</p>

        <div className="space-y-6">
          {attributes.map((attr, index) => (
            <div key={`${attr.question}-${index}`} className="space-y-2">
              <Label htmlFor={`attr-${index}`}>
                {attr.question}
                {attr.required && <span className="text-destructive ml-1">*</span>}
              </Label>

              {attr.helpText && <p className="text-xs text-muted-foreground">{attr.helpText}</p>}

              {/* Text Input */}
              {attr.type === "text" && (
                <Input
                  id={`attr-${index}`}
                  placeholder={attr.placeholder}
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
                  placeholder={attr.placeholder}
                  value={(getResponse(attr.question) as string) || ""}
                  onChange={(e) => updateResponse(attr.question, e.target.value)}
                  required={attr.required}
                  disabled={disabled}
                  rows={4}
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
          ))}
        </div>
      </div>
    </div>
  );
}
