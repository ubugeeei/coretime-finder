import type { TimeZoneCandidate } from "../../availability/coretimeTypes";
import type { SerializedMember } from "../../availability/coretimeTypes";

export type WorkbenchBootstrapState = {
  members: SerializedMember[];
  referenceDate: string;
  referenceTimeZone: string;
};

export type InferenceState =
  | { status: "idle" }
  | { status: "loading"; query: string }
  | { status: "error"; message: string }
  | { status: "ok"; candidates: TimeZoneCandidate[]; query: string };

export type DraftError = { status: "none" } | { status: "invalid"; message: string };
