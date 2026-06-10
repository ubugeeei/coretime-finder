import { existsSync, readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { execFileSync } from "node:child_process";

export type FilePredicate = (filePath: string) => boolean;

/**
 * Fails the current CI helper with a readable message.
 *
 * These scripts are executed directly by Node.js using native TypeScript stripping, so they avoid
 * shell-specific behavior while still keeping GitHub Actions YAML small and declarative.
 */
export function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

/**
 * Asserts a CI invariant and exits immediately when the invariant is violated.
 *
 * A small assertion helper keeps individual checks direct without throwing stack traces for normal
 * policy failures such as an invalid pull request title or a missing generated asset.
 */
export function assertCi(condition: unknown, message: string): asserts condition {
  if (!condition) {
    fail(message);
  }
}

/**
 * Reads a UTF-8 text file and reports a CI-oriented error when it is missing.
 */
export function readTextFile(filePath: string): string {
  assertCi(existsSync(filePath), `${filePath} does not exist.`);
  return readFileSync(filePath, "utf8");
}

/**
 * Walks files under one or more roots.
 *
 * Missing roots are ignored because some checks span optional framework entrypoints such as
 * `routes`, while still allowing a one-screen Vuerend app to keep most code under `src/features`.
 */
export function walkFiles(roots: readonly string[], predicate: FilePredicate): string[] {
  const files: string[] = [];

  function walk(directory: string): void {
    if (!existsSync(directory)) {
      return;
    }

    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const filePath = join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(filePath);
        continue;
      }
      if (predicate(filePath)) {
        files.push(filePath);
      }
    }
  }

  for (const root of roots) {
    walk(root);
  }

  return files;
}

/**
 * Finds source files containing a regular expression.
 */
export function findFilesMatching(
  roots: readonly string[],
  pattern: RegExp,
  predicate: FilePredicate,
): string[] {
  return walkFiles(roots, predicate).filter((filePath) => pattern.test(readTextFile(filePath)));
}

/**
 * Returns true for project source files that CI policy checks should parse as text.
 */
export function isSourceFile(filePath: string): boolean {
  return [".ts", ".vue"].includes(extname(filePath));
}

/**
 * Runs a command and inherits stdio so version checks appear in the job log.
 */
export function run(command: string, args: readonly string[]): void {
  execFileSync(command, [...args], { stdio: "inherit" });
}
