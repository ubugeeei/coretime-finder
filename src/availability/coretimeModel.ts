import type {
  CandidateInterval,
  CoverageSlot,
  DayPhaseSegment,
  DayPhaseSnapshot,
  Member,
  MemberId,
  MemberTimeline,
  TimelineSegment,
} from "./coretimeTypes";
import { clockFromMinute, dayPhaseForMinute } from "./timeMath";
import {
  getCurrentInstantEpochMilliseconds,
  getLocalDateSnapshot,
  getLocalMinute,
  zonedTimeToUtcMs,
} from "./timeZoneMath";
import type { InstantInput } from "./timeZoneMath";

/**
 * Samples the reference day into fixed-width slots and counts which members can attend each slot.
 *
 * All comparisons happen through an instant, so windows authored in different home time zones are
 * compared on the same timeline before being projected back into the reference-zone UI.
 */
export function buildAvailabilitySlots(input: {
  members: readonly Member[];
  referenceDate: string;
  referenceTimeZone: string;
  stepMinutes: number;
}): CoverageSlot[] {
  if (input.members.length === 0) {
    return [];
  }

  const slots: CoverageSlot[] = [];
  for (let startMinute = 0; startMinute < 1440; startMinute += input.stepMinutes) {
    const endMinute = Math.min(1440, startMinute + input.stepMinutes);
    const instant = zonedTimeToUtcMs(input.referenceDate, startMinute, input.referenceTimeZone);
    const activeMemberIds = input.members
      .filter((member) => isMemberAvailableAt(member, instant))
      .map((member) => member.id);

    slots.push({
      activeMemberIds,
      count: activeMemberIds.length,
      endMinute,
      level: coverageLevel(activeMemberIds.length, input.members.length),
      startMinute,
    });
  }

  return slots;
}

/**
 * Builds row data for each member's work windows, local day phases, and current local snapshot.
 *
 * The timeline segments are expressed in reference-zone minutes so rows align visually, while phase
 * labels are calculated in each member's own home time zone.
 */
export function buildMemberTimelines(input: {
  members: readonly Member[];
  phaseReferenceInstant?: InstantInput;
  referenceDate: string;
  referenceTimeZone: string;
  stepMinutes: number;
}): MemberTimeline[] {
  return input.members.map((member) => ({
    member,
    phaseSegments: buildDayPhaseSegments({ ...input, member }),
    phaseSnapshot: getDayPhaseSnapshot({
      member,
      referenceDate: input.referenceDate,
      referenceInstant: input.phaseReferenceInstant ?? getCurrentInstantEpochMilliseconds(),
    }),
    segments: mergeTimelineSlots(buildMemberSlots({ ...input, member })),
  }));
}

/**
 * Collapses qualifying coverage slots into candidate meeting windows.
 *
 * Adjacent slots are merged only when the active member set is identical, which keeps the displayed
 * candidate participant list accurate for the full duration.
 */
export function findCandidateIntervals(
  slots: readonly CoverageSlot[],
  minParticipants: number,
): CandidateInterval[] {
  const candidates: CandidateInterval[] = [];
  let current: CandidateInterval | undefined;

  for (const slot of slots) {
    if (slot.count < minParticipants || slot.count === 0) {
      if (current !== undefined) {
        candidates.push(current);
        current = undefined;
      }
      continue;
    }

    const activeMemberIds = [...slot.activeMemberIds].sort();
    const activeKey = activeMemberIds.join("|");
    const currentKey = current?.activeMemberIds.join("|");
    if (
      current !== undefined &&
      current.endMinute === slot.startMinute &&
      currentKey === activeKey
    ) {
      current = {
        ...current,
        durationMinutes: slot.endMinute - current.startMinute,
        endMinute: slot.endMinute,
      };
      continue;
    }
    if (current !== undefined) {
      candidates.push(current);
    }
    current = {
      activeMemberIds,
      count: slot.count,
      durationMinutes: slot.endMinute - slot.startMinute,
      endMinute: slot.endMinute,
      startMinute: slot.startMinute,
    };
  }

  if (current !== undefined) {
    candidates.push(current);
  }

  return candidates.sort(candidateSort);
}

/** Returns the highest-attendance, longest, earliest candidate interval. */
export function bestCandidate(
  candidates: readonly CandidateInterval[],
): CandidateInterval | undefined {
  return [...candidates].sort(candidateSort)[0];
}

/** Resolves member names in id order while tolerating stale ids from older candidate data. */
export function memberNamesForIds(members: readonly Member[], ids: readonly MemberId[]): string[] {
  const membersById = new Map(members.map((member) => [member.id, member.name]));

  return ids.map((id) => membersById.get(id)).filter((name): name is string => name !== undefined);
}

function buildMemberSlots(input: {
  member: Member;
  referenceDate: string;
  referenceTimeZone: string;
  stepMinutes: number;
}): TimelineSegment[] {
  return slotsForDay(input).filter((slot) => isMemberAvailableAt(input.member, slot.instant));
}

function buildDayPhaseSegments(input: {
  member: Member;
  referenceDate: string;
  referenceTimeZone: string;
  stepMinutes: number;
}): DayPhaseSegment[] {
  return mergeDayPhaseSlots(
    slotsForDay(input).map(function mapSlotToDayPhaseSegment(slot) {
      const localMinute = getLocalMinute(slot.instant, input.member.homeTimeZone);
      const localDate = getLocalDateSnapshot(
        slot.instant,
        input.member.homeTimeZone,
        input.referenceDate,
      );

      return {
        ...localDate,
        durationMinutes: slot.durationMinutes,
        endMinute: slot.endMinute,
        phase: dayPhaseForMinute(localMinute),
        startMinute: slot.startMinute,
      };
    }),
  );
}

function slotsForDay(input: {
  referenceDate: string;
  referenceTimeZone: string;
  stepMinutes: number;
}): (TimelineSegment & { instant: number })[] {
  const slots: (TimelineSegment & { instant: number })[] = [];
  for (let startMinute = 0; startMinute < 1440; startMinute += input.stepMinutes) {
    const endMinute = Math.min(1440, startMinute + input.stepMinutes);
    slots.push({
      durationMinutes: endMinute - startMinute,
      endMinute,
      instant: zonedTimeToUtcMs(input.referenceDate, startMinute, input.referenceTimeZone),
      startMinute,
    });
  }
  return slots;
}

function getDayPhaseSnapshot(input: {
  member: Member;
  referenceDate: string;
  referenceInstant: InstantInput;
}): DayPhaseSnapshot {
  const localMinute = getLocalMinute(input.referenceInstant, input.member.homeTimeZone);
  const localDate = getLocalDateSnapshot(
    input.referenceInstant,
    input.member.homeTimeZone,
    input.referenceDate,
  );

  return {
    ...localDate,
    localTime: clockFromMinute(localMinute),
    phase: dayPhaseForMinute(localMinute),
    timeZone: input.member.homeTimeZone,
  };
}

function mergeTimelineSlots(slots: readonly TimelineSegment[]): TimelineSegment[] {
  const merged: TimelineSegment[] = [];
  for (const slot of slots) {
    const previous = merged.at(-1);
    if (previous !== undefined && previous.endMinute === slot.startMinute) {
      previous.endMinute = slot.endMinute;
      previous.durationMinutes = previous.endMinute - previous.startMinute;
      continue;
    }
    merged.push({ ...slot });
  }
  return merged;
}

function mergeDayPhaseSlots(slots: readonly DayPhaseSegment[]): DayPhaseSegment[] {
  const merged: DayPhaseSegment[] = [];
  for (const slot of slots) {
    const previous = merged.at(-1);
    if (
      previous !== undefined &&
      previous.endMinute === slot.startMinute &&
      previous.phase === slot.phase &&
      previous.localDate === slot.localDate
    ) {
      previous.endMinute = slot.endMinute;
      previous.durationMinutes = previous.endMinute - previous.startMinute;
      continue;
    }
    merged.push({ ...slot });
  }
  return merged;
}

function isMemberAvailableAt(member: Member, instant: InstantInput): boolean {
  return member.windows.some((window) => {
    const localMinute = getLocalMinute(instant, window.timeZone);

    return isMinuteInsideWindow(localMinute, window.startMinute, window.endMinute);
  });
}

function isMinuteInsideWindow(
  minuteOfDay: number,
  startMinute: number,
  endMinute: number,
): boolean {
  if (startMinute === endMinute) {
    return false;
  }
  // Windows that cross midnight are represented by an end minute smaller than the start minute.
  return startMinute < endMinute
    ? startMinute <= minuteOfDay && minuteOfDay < endMinute
    : startMinute <= minuteOfDay || minuteOfDay < endMinute;
}

function coverageLevel(count: number, total: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0 || total === 0) {
    return 0;
  }
  const ratio = count / total;
  return ratio >= 1 ? 4 : ratio >= 0.67 ? 3 : ratio >= 0.34 ? 2 : 1;
}

function candidateSort(a: CandidateInterval, b: CandidateInterval): number {
  return (
    b.count - a.count || b.durationMinutes - a.durationMinutes || a.startMinute - b.startMinute
  );
}
