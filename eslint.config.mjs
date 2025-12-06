import { defineConfig, globalIgnores } from "eslint/config";
import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "node:url";

const compat = new FlatCompat({
  baseDirectory: fileURLToPath(new URL(".", import.meta.url)),
});

const eslintConfig = defineConfig([
  ...compat.config({
    extends: ["next/core-web-vitals", "next/typescript"],
  }),
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated Prisma client/runtime – lint noise only.
    "src/generated/**",
    "scripts/set-role.js",
  ]),
]);

export default eslintConfig;
