declare const MemberIdMarker: unique symbol;
declare const WorkWindowIdMarker: unique symbol;

/**
 * Branded identifiers keep member ids and work-window ids from being mixed accidentally.
 *
 * They are still plain strings at runtime, which keeps URL snapshots and local storage compact.
 */
export type MemberId = string & { readonly [MemberIdMarker]: never };
export type WorkWindowId = string & { readonly [WorkWindowIdMarker]: never };

/** Visual swatches supported by the shared CSS color token table. */
export type MemberColor = "amber" | "blue" | "green" | "rose" | "teal";

/** Coarse local-day buckets used to explain whether a teammate is in work, evening, or night time. */
export type DayPhase = "day" | "deep-night" | "evening" | "morning" | "night";

/** Storage-safe work-window shape used in profiles and share URLs. */
export type SerializedWorkWindow = {
  id: string;
  label: string;
  timeZone: string;
  startMinute: number;
  endMinute: number;
};

/** Storage-safe member shape before branded ids are restored. */
export type SerializedMember = {
  id: string;
  name: string;
  region: string;
  homeTimeZone: string;
  color: MemberColor;
  windows: SerializedWorkWindow[];
};

/** A recurring local-time availability range for one member. */
export type WorkWindow = {
  id: WorkWindowId;
  label: string;
  timeZone: string;
  startMinute: number;
  endMinute: number;
};

/** A person included in the overlap calculation. */
export type Member = {
  id: MemberId;
  name: string;
  region: string;
  homeTimeZone: string;
  color: MemberColor;
  windows: WorkWindow[];
};

/** Ranked result for turning a free-form region/city input into an IANA time zone. */
export type TimeZoneCandidate = {
  timeZone: string;
  label: string;
  region: string;
  score: number;
};

/** One sampled interval on the reference-zone timeline. */
export type CoverageSlot = {
  startMinute: number;
  endMinute: number;
  activeMemberIds: MemberId[];
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
};

/** A continuous range on the reference-zone day. */
export type TimelineSegment = {
  startMinute: number;
  endMinute: number;
  durationMinutes: number;
};

/** Local calendar metadata for a member at a reference instant or interval. */
export type LocalDayMarker = {
  dayOffset: number;
  isWeekend: boolean;
  localDate: string;
  localDay: string;
};

export type DayPhaseSegment = TimelineSegment &
  LocalDayMarker & {
    phase: DayPhase;
  };

/** The member's current local state shown beside each timeline row. */
export type DayPhaseSnapshot = LocalDayMarker & {
  localTime: string;
  phase: DayPhase;
  timeZone: string;
};

/** Candidate overlap interval that satisfies the selected participant threshold. */
export type CandidateInterval = TimelineSegment & {
  activeMemberIds: MemberId[];
  count: number;
};

/** Fully prepared row model for the timeline visualization. */
export type MemberTimeline = {
  member: Member;
  phaseSegments: DayPhaseSegment[];
  phaseSnapshot: DayPhaseSnapshot;
  segments: TimelineSegment[];
};

/** Ordered palette used when assigning colors to newly added members. */
export const MEMBER_COLORS: MemberColor[] = ["teal", "blue", "amber", "rose", "green"];

/** User-facing labels for local day-phase badges. */
export const DAY_PHASE_LABELS: Record<DayPhase, string> = {
  day: "Day",
  "deep-night": "Late night",
  evening: "Evening",
  morning: "Morning",
  night: "Night",
};

/** Restores the branded type after reading a member id from storage, URL state, or DOM events. */
export function memberId(value: string): MemberId {
  return value as MemberId;
}

/** Restores the branded type after reading a work-window id from storage or URL state. */
export function workWindowId(value: string): WorkWindowId {
  return value as WorkWindowId;
}
