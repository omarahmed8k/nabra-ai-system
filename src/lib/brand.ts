export const BRAND = {
  name: "Wengz",
  nameAr: "وينجز",
  logo: "/images/logo.svg",
  colors: {
    purple: "#690DD4",
    yellow: "#E0F840",
    purpleRgb: "105, 13, 212",
    yellowRgb: "224, 248, 64",
  },
} as const;

export function brandName(locale?: string): string {
  return locale === "ar" ? BRAND.nameAr : BRAND.name;
}
