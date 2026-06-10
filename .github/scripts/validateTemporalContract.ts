import { assertCi, findFilesMatching, isSourceFile, readTextFile } from "./ciHelpers.ts";

/**
 * Validates the Temporal runtime contract.
 *
 * The app uses Temporal for availability math and ships a packaged fallback for browsers without
 * native Temporal support. CI protects that decision by requiring the dependency and README
 * documentation while still rejecting Date/Intl-based time-zone math regressions.
 */
const readme = readTextFile("README.md");
const packageJson = JSON.parse(readTextFile("package.json")) as {
  dependencies?: Record<string, string>;
};
const timeZoneMath = readTextFile("src/availability/timeZoneMath.ts");

assertCi(
  /JavaScript [`"]?Temporal[`"]?/.test(readme),
  "README.md must document the JavaScript Temporal runtime.",
);
assertCi(
  /packaged polyfill/.test(readme),
  "README.md must document the packaged Temporal polyfill fallback.",
);
assertCi(
  packageJson.dependencies?.["@js-temporal/polyfill"] !== undefined,
  "package.json must include @js-temporal/polyfill.",
);
assertCi(
  timeZoneMath.includes('from "@js-temporal/polyfill"'),
  "src/availability/timeZoneMath.ts must import @js-temporal/polyfill.",
);
assertCi(
  /globalThis\.Temporal\s*\?\?/.test(timeZoneMath),
  "src/availability/timeZoneMath.ts must prefer native Temporal and fall back to the polyfill.",
);

const productionSource = (filePath: string): boolean =>
  isSourceFile(filePath) && !filePath.endsWith(".test.ts");
const forbiddenRuntimeHelpers = /getTemporal|nativeTemporal|Temporal\s*===\s*undefined/;
const forbiddenRuntimeHelperFiles = findFilesMatching(
  ["src", "routes"],
  forbiddenRuntimeHelpers,
  productionSource,
);

assertCi(
  forbiddenRuntimeHelperFiles.length === 0,
  `Use the centralized Temporal runtime fallback only:\n${forbiddenRuntimeHelperFiles.join("\n")}`,
);

const dateMathFiles = findFilesMatching(
  ["src/availability"],
  /DateTimeFormat[\s\S]*timeZone|Date\.UTC/,
  productionSource,
);

assertCi(
  dateMathFiles.length === 0,
  `Availability time-zone math must stay on Temporal:\n${dateMathFiles.join("\n")}`,
);
