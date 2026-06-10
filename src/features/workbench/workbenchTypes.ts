import type { TimeZoneCandidate } from "../../availability/coretimeTypes";
import type { SerializedMember } from "../../availability/coretimeTypes";

/** Initial state passed from SSR/bootstrap code into the hydrated workbench island. */
export type WorkbenchBootstrapState = {
  members: SerializedMember[];
  referenceDate: string;
  referenceTimeZone: string;
};

/** Async region inference state shown by member creation controls. */
export type InferenceState =
  | { status: "idle" }
  | { status: "loading"; query: string }
  | { status: "error"; message: string }
  | { status: "ok"; candidates: TimeZoneCandidate[]; query: string };

/** Validation state for small edit forms that can stay local to the workbench VM. */
export type DraftError = { status: "none" } | { status: "invalid"; message: string };
