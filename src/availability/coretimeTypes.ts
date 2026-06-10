declare const MemberIdMarker: unique symbol;
declare const WorkWindowIdMarker: unique symbol;

export type MemberId = string & { readonly [MemberIdMarker]: never };
export type WorkWindowId = string & { readonly [WorkWindowIdMarker]: never };

export type MemberColor = "amber" | "blue" | "green" | "rose" | "teal";
export type DayPhase = "day" | "deep-night" | "evening" | "morning" | "night";

export type SerializedWorkWindow = {
  id: string;
  label: string;
  timeZone: string;
  startMinute: number;
  endMinute: number;
};

export type SerializedMember = {
  id: string;
  name: string;
  region: string;
  homeTimeZone: string;
  color: MemberColor;
  windows: SerializedWorkWindow[];
};

export type WorkWindow = {
  id: WorkWindowId;
  label: string;
  timeZone: string;
  startMinute: number;
  endMinute: number;
};

export type Member = {
  id: MemberId;
  name: string;
  region: string;
  homeTimeZone: string;
  color: MemberColor;
  windows: WorkWindow[];
};

export type TimeZoneCandidate = {
  timeZone: string;
  label: string;
  region: string;
  score: number;
};

export type CoverageSlot = {
  startMinute: number;
  endMinute: number;
  activeMemberIds: MemberId[];
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
};

export type TimelineSegment = {
  startMinute: number;
  endMinute: number;
  durationMinutes: number;
};

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

export type DayPhaseSnapshot = LocalDayMarker & {
  localTime: string;
  phase: DayPhase;
  timeZone: string;
};

export type CandidateInterval = TimelineSegment & {
  activeMemberIds: MemberId[];
  count: number;
};

export type MemberTimeline = {
  member: Member;
  phaseSegments: DayPhaseSegment[];
  phaseSnapshot: DayPhaseSnapshot;
  segments: TimelineSegment[];
};

export const MEMBER_COLORS: MemberColor[] = ["teal", "blue", "amber", "rose", "green"];

export const DAY_PHASE_LABELS: Record<DayPhase, string> = {
  day: "Day",
  "deep-night": "Late night",
  evening: "Evening",
  morning: "Morning",
  night: "Night",
};

export function memberId(value: string): MemberId {
  return value as MemberId;
}

export function workWindowId(value: string): WorkWindowId {
  return value as WorkWindowId;
}
