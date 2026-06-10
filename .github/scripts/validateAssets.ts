import { readFileSync } from "node:fs";
import { assertCi, findFilesMatching, readTextFile } from "./ciHelpers.ts";

/**
 * Validates generated social preview assets and their metadata references.
 *
 * Core Time Finder intentionally ships a real PNG Open Graph image. This check prevents regressions
 * back to SVG metadata or incorrectly sized bitmap assets.
 */
const pngPath = "public/og-image.png";
const faviconPath = "public/favicon.svg";
const png = readFileSync(pngPath);
const favicon = readTextFile(faviconPath);
const signature = png.subarray(0, 8).toString("hex");
const width = png.readUInt32BE(16);
const height = png.readUInt32BE(20);
const appSource = readTextFile("src/app.ts");
const ogImageUrl = "https://coretime-finder.void.app/og-image.png";

assertCi(signature === "89504e470d0a1a0a", `${pngPath} is not a PNG file.`);
assertCi(width === 1200 && height === 630, `${pngPath} must be 1200x630, got ${width}x${height}.`);
assertCi(favicon.includes("<svg"), `${faviconPath} must be an SVG favicon.`);
assertCi(appSource.includes(ogImageUrl), `src/app.ts must reference ${ogImageUrl}.`);
assertCi(appSource.includes('href: "/favicon.svg"'), "src/app.ts must reference /favicon.svg.");
assertCi(!appSource.includes('href: "data:,'), "src/app.ts must not use an empty data favicon.");

const svgReferences = findFilesMatching(
  ["public", "src", "routes"],
  /og-image\.svg/,
  (filePath) => !filePath.includes("node_modules"),
);

assertCi(
  svgReferences.length === 0,
  `Remove og-image.svg references:\n${svgReferences.join("\n")}`,
);
