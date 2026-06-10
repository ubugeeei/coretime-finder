import { run } from "./ciHelpers.ts";

/**
 * Prints the core toolchain versions used by CI.
 *
 * This stays outside the workflow file so the install job remains a declarative list of actions
 * rather than a shell script embedded in YAML.
 */
run("node", ["--version"]);
run("pnpm", ["--version"]);
run("pnpm", ["exec", "vp", "--version"]);
run("pnpm", ["exec", "vize", "--version"]);
