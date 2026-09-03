import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  {
    // Keep CI green while legacy code is cleaned up gradually.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/refs": "warn",
      "react/no-unescaped-entities": "warn",
      "@next/next/no-img-element": "warn",
    },
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "test-results/**",
    "playwright-report/**",
    "next-env.d.ts",
    "public/sw.js",
    "public/workbox-*.js",
    "scripts/**",
  ]),
]);
