import type { LocalizedText } from "@/types/i18n";

export function resolveLocalizedText(
  text: string | LocalizedText | null | undefined,
  locale: string,
  fallback?: string
): string {
  if (!text && fallback) return fallback;
  if (!text) return "";
  if (typeof text === "string") return text;
  const value = (text as LocalizedText)[locale];
  if (value && value.trim().length > 0) return value;
  // Fallback order: en -> ar -> any first value
  const en = (text as LocalizedText)["en"];
  if (en && en.trim().length > 0) return en;
  const ar = (text as LocalizedText)["ar"];
  if (ar && ar.trim().length > 0) return ar;
  const first = Object.values(text as LocalizedText)[0];
  return typeof first === "string" ? first : (fallback ?? "");
}
