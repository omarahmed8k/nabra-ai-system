export type LocalizedText = {
  [locale: string]: string;
};

export function isLocalizedText(value: unknown): value is LocalizedText {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
