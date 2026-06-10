import { assertCi, findFilesMatching, isSourceFile, readTextFile } from "./ciHelpers.ts";

/**
 * Validates the native Temporal runtime contract.
 *
 * The app is allowed to require browsers with native Temporal support. CI protects that decision by
 * rejecting polyfill-style helpers and fallback checks in production source while requiring README
 * documentation that clearly says unsupported browsers are not handled.
 */
const readme = readTextFile("README.md");

assertCi(
  /native JavaScript[\s\S]*Temporal/.test(readme),
  "README.md must document the native JavaScript Temporal requirement.",
);
assertCi(
  /no [\s\S]*Temporal[\s\S]*polyfill/.test(readme),
  "README.md must state that no Temporal polyfill is used.",
);

const productionSource = (filePath: string): boolean =>
  isSourceFile(filePath) && !filePath.endsWith(".test.ts");
const fallbackPatterns =
  /getTemporal|nativeTemporal|typeof\s+Temporal\s*===\s*["']undefined["']|Temporal\s*===\s*undefined/;
const fallbackFiles = findFilesMatching(["src", "routes"], fallbackPatterns, productionSource);

assertCi(
  fallbackFiles.length === 0,
  `Temporal fallback code is not allowed:\n${fallbackFiles.join("\n")}`,
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
