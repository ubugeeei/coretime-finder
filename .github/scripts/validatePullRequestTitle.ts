import { assertCi } from "./ciHelpers.ts";

/**
 * Enforces the repository pull request title contract.
 *
 * AGENTS.md asks for conventional pull request titles and explicitly disallows the `[codex]`
 * prefix/marker, so CI validates that convention before the heavier jobs become relevant.
 */
const title = process.env.PR_TITLE ?? "";
const conventionalTitle =
  /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-z0-9._-]+\))?!?: .+$/;

assertCi(title.length > 0, "PR_TITLE is required.");
assertCi(!title.toLowerCase().includes("[codex]"), "Pull request titles must not contain [codex].");
assertCi(
  conventionalTitle.test(title),
  "Pull request title must be conventional, for example: feat(workbench): add profile sharing",
);
