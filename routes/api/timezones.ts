/**
 * Void file-route entrypoint for `/api/timezones`.
 *
 * Keep route discovery files at the repository root, but keep implementation inside `src/features`
 * so application behavior is not split between two route trees.
 */
export { GET } from "../../src/features/timezones/timeZoneApi";
