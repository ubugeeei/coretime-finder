import type { DayPhase } from "./coretimeTypes";

export function parseClock(clock: string): number | undefined {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(clock);
  if (match === null) {
    return undefined;
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

export function clockFromMinute(minuteOfDay: number): string {
  const bounded = normalizeMinute(minuteOfDay);
  const hour = Math.floor(bounded / 60);
  const minute = bounded % 60;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function formatMinute(minuteOfDay: number): string {
  if (minuteOfDay === 1440) {
    return "24:00";
  }

  return clockFromMinute(minuteOfDay);
}

export function formatMinuteRange(startMinute: number, endMinute: number): string {
  return `${formatMinute(startMinute)}-${formatMinute(endMinute)}`;
}

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

export function normalizeMinute(minuteOfDay: number): number {
  const minute = Math.trunc(minuteOfDay) % 1440;

  return minute < 0 ? minute + 1440 : minute;
}
