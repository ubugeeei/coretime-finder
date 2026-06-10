import { defineConfig } from "vize";

export default defineConfig({
  files: ["src/**/*.vue"],
  ignores: ["src/**/*.test.ts"],
  compiler: {
    customRenderer: false,
    sourceMap: true,
    templateSyntax: "strict",
    vapor: false,
  },
  linter: {
    preset: "opinionated",
  },
  typeChecker: {
    enabled: true,
    strict: true,
  },
  vite: {
    scanPatterns: ["src/**/*.vue"],
  },
});
