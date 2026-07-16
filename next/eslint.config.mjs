import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "prefer-const": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    files: ["**/*.stories.tsx"],
    rules: {
      "react-hooks/rules-of-hooks": "warn",
    },
  },
  globalIgnores([".next/**", "node_modules/**", "storybook-static/**"]),
]);
