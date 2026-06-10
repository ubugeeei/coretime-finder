import { existsSync } from "node:fs";
import { assertCi, findFilesMatching, isSourceFile, readTextFile, walkFiles } from "./ciHelpers.ts";

/**
 * Validates source organization rules that are easy to regress during UI iteration.
 *
 * These checks encode user-facing project conventions: no duplicate route trees, no generic feature
 * component buckets, no barrel exports, Vite tasks instead of npm scripts, scoped SFC styles, and a
 * soft maximum of 300 lines per TypeScript/Vue source file.
 */
assertCi(!existsSync("src/routes"), "Use routes/ only; src/routes is intentionally absent.");
assertCi(!existsSync("src/islands.ts"), "Island registration lives with the workbench feature.");
assertCi(
  !existsSync("src/features/components"),
  "Do not add generic feature components directories.",
);
assertCi(
  !existsSync("src/availability/defaultWorkbenchProps.ts"),
  "Old default props module must not return.",
);
assertCi(
  !existsSync("src/availability/nativeTemporal.ts"),
  "Do not add a second Temporal runtime helper.",
);

const barrelExports = findFilesMatching(["src", "routes"], /export\s+\*/, isSourceFile);
assertCi(
  barrelExports.length === 0,
  `Barrel exports are not allowed:\n${barrelExports.join("\n")}`,
);

const longFiles = walkFiles(["src", "routes"], isSourceFile).flatMap((filePath) => {
  const lines = readTextFile(filePath).split("\n").length;
  return lines > 300 ? [`${filePath}: ${lines}`] : [];
});
assertCi(longFiles.length === 0, `Files exceed 300 lines:\n${longFiles.join("\n")}`);

const packageJson = JSON.parse(readTextFile("package.json")) as { scripts?: unknown };
assertCi(
  !Object.prototype.hasOwnProperty.call(packageJson, "scripts"),
  "Use Vite tasks, not npm scripts.",
);

const unscopedStyles = walkFiles(["src"], (filePath) => filePath.endsWith(".vue")).filter(
  (filePath) => {
    const source = readTextFile(filePath);
    return [...source.matchAll(/<style\b([^>]*)>/g)].some(
      (match) => !/\bscoped\b/.test(match[1] ?? ""),
    );
  },
);

assertCi(unscopedStyles.length === 0, `Unscoped SFC styles:\n${unscopedStyles.join("\n")}`);
