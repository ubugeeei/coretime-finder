import type { DayPhase } from "./coretimeTypes";

/** Parses a strict 24-hour `HH:mm` clock value into minutes after midnight. */
export function parseClock(clock: string): number | undefined {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(clock);
  if (match === null) {
    return undefined;
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

/** Formats any minute value onto a normalized 00:00-23:59 clock. */
export function clockFromMinute(minuteOfDay: number): string {
  const bounded = normalizeMinute(minuteOfDay);
  const hour = Math.floor(bounded / 60);
  const minute = bounded % 60;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** Formats a timeline boundary, preserving 24:00 for the final edge of the reference day. */
export function formatMinute(minuteOfDay: number): string {
  if (minuteOfDay === 1440) {
    return "24:00";
  }

  return clockFromMinute(minuteOfDay);
}

/** Formats a half-open minute range used by window labels and timeline tooltips. */
export function formatMinuteRange(startMinute: number, endMinute: number): string {
  return `${formatMinute(startMinute)}-${formatMinute(endMinute)}`;
}

/** Formats a duration with the shortest stable label that still shows hours and minutes. */
export function formatDuration(durationMinutes: number): string {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }
  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

/** Maps local clock time to the broad day phase shown on timeline rows. */
export function dayPhaseForMinute(minuteOfDay: number): DayPhase {
  if (minuteOfDay < 5 * 60) {
    return "deep-night";
  }
  if (minuteOfDay < 11 * 60) {
    return "morning";
  }
  if (minuteOfDay < 17 * 60) {
    return "day";
  }
  if (minuteOfDay < 20 * 60) {
    return "evening";
  }

  return "night";
}

/** Wraps arbitrary minute values into the 0-1439 range. */
export function normalizeMinute(minuteOfDay: number): number {
  const minute = Math.trunc(minuteOfDay) % 1440;

  return minute < 0 ? minute + 1440 : minute;
}
