import { defineConfig } from "vite-plus";
import vize from "@vizejs/vite-plugin";
import { vuerend } from "@vuerend/core/vite";
import { voidPlugin } from "void";
import vizeConfig from "./vize.config";

export default defineConfig({
  fmt: {
    ignorePatterns: ["node_modules/**", "dist/**", ".void/**", ".wrangler/**"],
    semi: true,
    singleQuote: false,
  },
  test: {
    globals: false,
  },
  plugins: [
    voidPlugin(),
    vize({ config: vizeConfig, configMode: false, vueVersion: "legacy" }),
    ...vuerend({
      app: "./src/app.ts",
      islands: "./src/features/workbench/workbenchIslands.ts",
      jsx: false,
    }),
  ],
  run: {
    tasks: {
      build: {
        command: ["vp exec vize check src/**/*.vue", "vp build"],
        output: ["dist/**"],
      },
      check: [
        "vp exec vize check src/**/*.vue",
        "vp exec vize lint --preset opinionated --max-warnings 0 src/**/*.vue",
        "vp fmt --check",
      ],
      dev: { cache: false, command: "vp dev" },
      preview: { cache: false, command: "vp preview" },
      test: "vp test run",
    },
  },
});
