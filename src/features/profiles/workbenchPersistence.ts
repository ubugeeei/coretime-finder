import type { MemberColor } from "../../availability/coretimeTypes";
import type { SerializedMember } from "../../availability/coretimeTypes";

/** Versioned payload stored in local profiles and encoded into share URLs. */
export type WorkbenchSnapshot = {
  version: 1;
  members: SerializedMember[];
  minParticipants: number;
  referenceDate: string;
  referenceTimeZone: string;
};

/** User-named local profile with a complete restorable workbench snapshot. */
export type WorkbenchProfile = {
  id: string;
  name: string;
  snapshot: WorkbenchSnapshot;
  updatedAt: string;
};

const STORAGE_KEY = "core-time-finder:profiles";
const MEMBER_COLORS = new Set<MemberColor>(["amber", "blue", "green", "rose", "teal"]);

/**
 * Encodes a snapshot for a URL query parameter.
 *
 * The URL-safe base64 variant avoids percent-encoding `+`, `/`, and padding characters in share
 * links while still round-tripping arbitrary UTF-8 profile names and regions.
 */
export function encodeShareSnapshot(snapshot: WorkbenchSnapshot): string {
  const bytes = new TextEncoder().encode(JSON.stringify(snapshot));
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

/** Decodes a share URL payload and rejects unknown or malformed snapshot shapes. */
export function decodeShareSnapshot(value: string): WorkbenchSnapshot | undefined {
  try {
    const padded = value
      .replaceAll("-", "+")
      .replaceAll("_", "/")
      .padEnd(Math.ceil(value.length / 4) * 4, "=");
    const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));

    return isWorkbenchSnapshot(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/** Reads locally saved profiles, returning an empty list when storage is unavailable or corrupted. */
export function readStoredProfiles(): WorkbenchProfile[] {
  const storage = getLocalStorage();
  if (storage === undefined) {
    return [];
  }

  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) ?? "[]");

    return Array.isArray(parsed) ? parsed.filter(isWorkbenchProfile) : [];
  } catch {
    return [];
  }
}

/** Persists local profiles best-effort so private/embedded browser modes do not break the app. */
export function writeStoredProfiles(profiles: readonly WorkbenchProfile[]): void {
  const storage = getLocalStorage();
  if (storage === undefined) {
    return;
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch {
    // Storage can be disabled in embedded or private browser contexts.
  }
}

function getLocalStorage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function isWorkbenchProfile(value: unknown): value is WorkbenchProfile {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.updatedAt === "string" &&
    isWorkbenchSnapshot(value.snapshot)
  );
}

function isWorkbenchSnapshot(value: unknown): value is WorkbenchSnapshot {
  return (
    isRecord(value) &&
    value.version === 1 &&
    typeof value.referenceDate === "string" &&
    typeof value.referenceTimeZone === "string" &&
    typeof value.minParticipants === "number" &&
    Array.isArray(value.members) &&
    value.members.every(isSerializedMember)
  );
}

function isSerializedMember(value: unknown): value is SerializedMember {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.region === "string" &&
    typeof value.homeTimeZone === "string" &&
    typeof value.color === "string" &&
    MEMBER_COLORS.has(value.color as MemberColor) &&
    Array.isArray(value.windows) &&
    value.windows.every(isSerializedWorkWindow)
  );
}

function isSerializedWorkWindow(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    typeof value.timeZone === "string" &&
    isMinute(value.startMinute) &&
    isMinute(value.endMinute)
  );
}

function isMinute(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value < 1440;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
