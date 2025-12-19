"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import type { ServiceAttribute } from "@/types/service-attributes";
import { LocalizedInput } from "@/components/ui/localized-input";

interface AttributeWithId extends ServiceAttribute {
  _id?: string;
}

interface AttributesManagerProps {
  readonly attributes: ServiceAttribute[];
  readonly onChange: (attributes: ServiceAttribute[]) => void;
}

export function AttributesManager({ attributes, onChange }: AttributesManagerProps) {
  const t = useTranslations("admin.attributesManager");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Add stable IDs to attributes if they don't have them
  const attributesWithIds: AttributeWithId[] = attributes.map((attr, idx) => ({
    ...attr,
    _id: (attr as AttributeWithId)._id || `attr-${Date.now()}-${idx}`,
  }));

  const addAttribute = () => {
    const newAttribute: AttributeWithId = {
      question: "",
      required: true,
      type: "text",
      _id: `attr-${Date.now()}-new`,
    };
    onChange([...attributes, newAttribute]);
  };

  const updateAttribute = (index: number, updates: Partial<ServiceAttribute>) => {
    const newAttributes = [...attributes];
    newAttributes[index] = { ...newAttributes[index], ...updates };
    onChange(newAttributes);
  };

  const removeAttribute = (index: number) => {
    onChange(attributes.filter((_, i) => i !== index));
  };

  const updateOptions = (index: number, optionsText: string) => {
    // Store the raw input text in a special field to preserve user's typing including commas
    const options = optionsText
      .split(",")
      .map((opt) => opt.trim())
      .filter((opt) => opt.length > 0);
    updateAttribute(index, { options, _optionsRaw: optionsText } as any);
  };

  const moveAttribute = (fromIndex: number, toIndex: number) => {
    const newAttributes = [...attributes];
    const [movedItem] = newAttributes.splice(fromIndex, 1);
    newAttributes.splice(toIndex, 0, movedItem);
    onChange(newAttributes);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    moveAttribute(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const moveUp = (index: number) => {
    if (index > 0) {
      moveAttribute(index, index - 1);
    }
  };

  const moveDown = (index: number) => {
    if (index < attributes.length - 1) {
      moveAttribute(index, index + 1);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base">{t("title")}</Label>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addAttribute}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t("addQuestion")}
        </Button>
      </div>

      {attributes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {t("noQuestions")}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {attributesWithIds.map((attr, index) => (
            <Card
              key={attr._id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`cursor-move transition-opacity ${draggedIndex === index ? "opacity-50" : ""}`}
            >
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-3 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
                      title={t("dragToReorder")}
                    >
                      <GripVertical className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-4">
                      {/* Question Text (localized) */}
                      <div className="space-y-2">
                        <Label htmlFor={`question-${index}`}>
                          {t("question", { number: index + 1 })}
                        </Label>
                        <LocalizedInput
                          id={`question-${index}`}
                          placeholder={t("exampleQuestion")}
                          value={(attr as any).questionI18n ?? attr.question}
                          onChange={(next) =>
                            updateAttribute(index, {
                              questionI18n: next as any,
                              question: next.en?.trim() ? next.en : (next.ar ?? ""),
                            })
                          }
                          required
                          variant="input"
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        {/* Question Type */}
                        <div className="space-y-2">
                          <Label htmlFor={`type-${index}`}>{t("answerType")}</Label>
                          <Select
                            value={attr.type}
                            onValueChange={(value) =>
                              updateAttribute(index, {
                                type: value as ServiceAttribute["type"],
                                options:
                                  value === "select" || value === "multiselect"
                                    ? attr.options || []
                                    : undefined,
                              })
                            }
                          >
                            <SelectTrigger id={`type-${index}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">{t("text")}</SelectItem>
                              <SelectItem value="textarea">{t("textarea")}</SelectItem>
                              <SelectItem value="select">{t("select")}</SelectItem>
                              <SelectItem value="multiselect">{t("multiselect")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Required Checkbox */}
                        <div className="space-y-2">
                          <Label>{t("settings")}</Label>
                          <div className="flex items-center space-x-2 pt-2">
                            <Checkbox
                              id={`required-${index}`}
                              checked={attr.required}
                              onCheckedChange={(checked) =>
                                updateAttribute(index, { required: checked as boolean })
                              }
                            />
                            <label
                              htmlFor={`required-${index}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {t("required")}
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Options for Select/Multiselect */}
                      {(attr.type === "select" || attr.type === "multiselect") && (
                        <div className="space-y-2">
                          <Label htmlFor={`options-${index}`}>{t("options")}</Label>
                          <Input
                            id={`options-${index}`}
                            placeholder={t("exampleOptions")}
                            value={(attr as any)._optionsRaw ?? attr.options?.join(", ") ?? ""}
                            onChange={(e) => updateOptions(index, e.target.value)}
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            {t("optionsCount", { count: attr.options?.length || 0 })}
                          </p>
                        </div>
                      )}

                      {/* Placeholder (optional, localized) */}
                      <div className="space-y-2">
                        <Label htmlFor={`placeholder-${index}`}>
                          {t("placeholderOptional")}{" "}
                          <span className="text-muted-foreground">({t("optional")})</span>
                        </Label>
                        <LocalizedInput
                          id={`placeholder-${index}`}
                          placeholder={t("examplePlaceholder")}
                          value={(attr as any).placeholderI18n ?? attr.placeholder ?? ""}
                          onChange={(next) =>
                            updateAttribute(index, {
                              placeholderI18n: next as any,
                              placeholder: next.en?.trim() ? next.en : (next.ar ?? ""),
                            })
                          }
                          variant="input"
                        />
                      </div>

                      {/* Help Text (optional, localized) */}
                      <div className="space-y-2">
                        <Label htmlFor={`helptext-${index}`}>
                          {t("helpTextOptional")}{" "}
                          <span className="text-muted-foreground">({t("optional")})</span>
                        </Label>
                        <LocalizedInput
                          id={`helptext-${index}`}
                          placeholder={t("helpTextDescription")}
                          value={(attr as any).helpTextI18n ?? attr.helpText ?? ""}
                          onChange={(next) =>
                            updateAttribute(index, {
                              helpTextI18n: next as any,
                              helpText: next.en?.trim() ? next.en : (next.ar ?? ""),
                            })
                          }
                          variant="textarea"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-1 mt-2">
                      {/* Move Up */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={index === 0}
                        onClick={() => moveUp(index)}
                        title={t("moveUp")}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>

                      {/* Move Down */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={index === attributes.length - 1}
                        onClick={() => moveDown(index)}
                        title={t("moveDown")}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>

                      {/* Delete */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeAttribute(index)}
                        title={t("deleteQuestion")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
