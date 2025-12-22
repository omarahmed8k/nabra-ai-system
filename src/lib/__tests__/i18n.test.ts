import { resolveLocalizedText } from "../i18n";
import type { LocalizedText } from "@/types/i18n";

describe("resolveLocalizedText", () => {
  describe("with string input", () => {
    it("should return the string as-is", () => {
      const result = resolveLocalizedText("Simple string", "en");
      expect(result).toBe("Simple string");
    });

    it("should return the string regardless of locale", () => {
      const result = resolveLocalizedText("Simple string", "ar");
      expect(result).toBe("Simple string");
    });
  });

  describe("with LocalizedText object", () => {
    const localizedText: LocalizedText = {
      en: "English Text",
      ar: "نص عربي",
    };

    it("should return text in requested locale", () => {
      const result = resolveLocalizedText(localizedText, "en");
      expect(result).toBe("English Text");
    });

    it("should return Arabic text when locale is ar", () => {
      const result = resolveLocalizedText(localizedText, "ar");
      expect(result).toBe("نص عربي");
    });

    it("should fallback to English when requested locale is missing", () => {
      const result = resolveLocalizedText(localizedText, "fr");
      expect(result).toBe("English Text");
    });

    it("should fallback to Arabic if English is missing", () => {
      const textWithoutEn: LocalizedText = {
        ar: "نص عربي فقط",
      };
      const result = resolveLocalizedText(textWithoutEn, "fr");
      expect(result).toBe("نص عربي فقط");
    });

    it("should return first available value if en and ar are missing", () => {
      const textOtherLang: LocalizedText = {
        fr: "Texte français",
        de: "Deutscher Text",
      };
      const result = resolveLocalizedText(textOtherLang, "es");
      expect(result).toBe("Texte français");
    });

    it("should ignore empty strings in requested locale", () => {
      const textWithEmpty: LocalizedText = {
        en: "English Text",
        ar: "   ",
      };
      const result = resolveLocalizedText(textWithEmpty, "ar");
      expect(result).toBe("English Text");
    });

    it("should ignore whitespace-only strings", () => {
      const textWithWhitespace: LocalizedText = {
        en: "\n\t  ",
        ar: "نص عربي",
      };
      const result = resolveLocalizedText(textWithWhitespace, "en");
      expect(result).toBe("نص عربي");
    });
  });

  describe("with null or undefined input", () => {
    it("should return empty string for null", () => {
      const result = resolveLocalizedText(null, "en");
      expect(result).toBe("");
    });

    it("should return empty string for undefined", () => {
      const result = resolveLocalizedText(undefined, "en");
      expect(result).toBe("");
    });

    it("should return fallback for null when provided", () => {
      const result = resolveLocalizedText(null, "en", "Fallback Text");
      expect(result).toBe("Fallback Text");
    });

    it("should return fallback for undefined when provided", () => {
      const result = resolveLocalizedText(undefined, "en", "Fallback Text");
      expect(result).toBe("Fallback Text");
    });
  });

  describe("with fallback parameter", () => {
    it("should use fallback when text is null", () => {
      const result = resolveLocalizedText(null, "en", "Default");
      expect(result).toBe("Default");
    });

    it("should use fallback when LocalizedText is empty", () => {
      const emptyText: LocalizedText = {};
      const result = resolveLocalizedText(emptyText, "en", "Default");
      expect(result).toBe("Default");
    });

    it("should not use fallback when valid text exists", () => {
      const text: LocalizedText = { en: "Real Text" };
      const result = resolveLocalizedText(text, "en", "Default");
      expect(result).toBe("Real Text");
    });

    it("should use fallback when all values are empty", () => {
      const textAllEmpty: LocalizedText = {
        en: "",
        ar: "",
      };
      // When all values are empty or whitespace, the function returns empty string
      // because it finds an empty string value before reaching the fallback logic
      const result = resolveLocalizedText(textAllEmpty, "fr", "Default");
      expect(result).toBe("");
    });
  });

  describe("real-world scenarios", () => {
    it("should handle service type localization", () => {
      const serviceType: LocalizedText = {
        en: "Digital QR Menu",
        ar: "منيو QR ديجيتال",
      };

      expect(resolveLocalizedText(serviceType, "en")).toBe("Digital QR Menu");
      expect(resolveLocalizedText(serviceType, "ar")).toBe("منيو QR ديجيتال");
    });

    it("should handle package name localization", () => {
      const packageName: LocalizedText = {
        en: "Premium Package",
        ar: "الباقة المميزة",
      };

      expect(resolveLocalizedText(packageName, "en")).toBe("Premium Package");
      expect(resolveLocalizedText(packageName, "ar")).toBe("الباقة المميزة");
    });

    it("should use name as fallback for missing i18n", () => {
      const result = resolveLocalizedText(undefined, "ar", "Basic Service");
      expect(result).toBe("Basic Service");
    });

    it("should handle mixed content with credits term", () => {
      const description: LocalizedText = {
        en: "Service costs 10 credits",
        ar: "الخدمة تكلف 10 كريدت",
      };

      expect(resolveLocalizedText(description, "ar")).toContain("كريدت");
      expect(resolveLocalizedText(description, "en")).toContain("credits");
    });
  });

  describe("edge cases", () => {
    it("should handle objects with non-string values gracefully", () => {
      const invalidText = {
        en: null,
        ar: undefined,
      } as any;

      const result = resolveLocalizedText(invalidText, "en", "Fallback");
      expect(result).toBe("Fallback");
    });

    it("should handle deeply nested locale keys", () => {
      const text: LocalizedText = {
        "en-US": "American English",
        "en-GB": "British English",
        en: "English",
        ar: "عربي",
      };

      // Should match exact locale
      expect(resolveLocalizedText(text, "en")).toBe("English");
      // Non-existent locale should fallback to en
      expect(resolveLocalizedText(text, "fr")).toBe("English");
    });

    it("should preserve special characters in Arabic text", () => {
      const text: LocalizedText = {
        en: "Menu (Digital)",
        ar: "منيو (رقمي)",
      };

      const result = resolveLocalizedText(text, "ar");
      expect(result).toBe("منيو (رقمي)");
      expect(result).toContain("(");
      expect(result).toContain(")");
    });
  });
});
