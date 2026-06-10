import { Temporal as TemporalPolyfill } from "@js-temporal/polyfill";
import { normalizeMinute } from "./timeMath";

/** Instant-like inputs accepted by the availability calculator and test fixtures. */
export type InstantInput = Date | number | Temporal.Instant;

/** Local calendar metadata derived from an instant in a specific time zone. */
export type LocalDateSnapshot = {
  dayOffset: number;
  isWeekend: boolean;
  localDate: string;
  localDay: string;
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Uses native Temporal when available and falls back to the packaged polyfill on mobile browsers
 * that have not shipped the global yet.
 */
const TemporalRuntime: typeof Temporal =
  globalThis.Temporal ?? (TemporalPolyfill as typeof Temporal);

/**
 * Formats the UTC offset for a time zone on a specific reference date.
 *
 * The calculation intentionally uses Temporal's time-zone database instead of approximating with
 * `Date` or `Intl`. Browsers without native Temporal support use the packaged polyfill.
 */
export function formatTimeZoneOffset(timeZone: string, dateInput: string): string {
  const offsetMinutes =
    zonedDateTimeFromMinute(dateInput, 12 * 60, timeZone).offsetNanoseconds / 60_000_000_000;
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = Math.floor(absoluteMinutes / 60);
  const minutes = absoluteMinutes % 60;

  return `UTC${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function formatTimeZoneLabel(timeZone: string, dateInput: string): string {
  return `${timeZone} (${formatTimeZoneOffset(timeZone, dateInput)})`;
}

/** Returns the ISO local date for an instant in a target time zone. */
export function getDateInTimeZone(instantInput: InstantInput, timeZone: string): string {
  return instantFromInput(instantInput).toZonedDateTimeISO(timeZone).toPlainDate().toString();
}

/** Returns today's date in the selected reference zone, not in the browser's local zone. */
export function getCurrentDateInTimeZone(timeZone: string): string {
  return TemporalRuntime.Now.instant().toZonedDateTimeISO(timeZone).toPlainDate().toString();
}

/** Provides a numeric current instant for reactive timeline snapshots. */
export function getCurrentInstantEpochMilliseconds(): number {
  return TemporalRuntime.Now.instant().epochMilliseconds;
}

/** Provides an ISO timestamp for profile update metadata. */
export function getCurrentInstantIsoString(): string {
  return TemporalRuntime.Now.instant().toString();
}

/** Projects an instant into local minutes after midnight in the requested time zone. */
export function getLocalMinute(instantInput: InstantInput, timeZone: string): number {
  const zonedDateTime = instantFromInput(instantInput).toZonedDateTimeISO(timeZone);

  return zonedDateTime.hour * 60 + zonedDateTime.minute;
}

/** Returns local date/weekend information plus offset from the reference date. */
export function getLocalDateSnapshot(
  instantInput: InstantInput,
  timeZone: string,
  referenceDate: string,
): LocalDateSnapshot {
  const localDate = getDateInTimeZone(instantInput, timeZone);
  const dayOfWeek = TemporalRuntime.PlainDate.from(localDate).dayOfWeek;

  return {
    dayOffset: dateDifferenceInDays(referenceDate, localDate),
    isWeekend: dayOfWeek >= 6,
    localDate,
    localDay: DAY_LABELS[dayOfWeek - 1] ?? "Mon",
  };
}

/** Converts a date and local minute in a time zone into the comparable UTC epoch timeline. */
export function zonedTimeToUtcMs(dateInput: string, minuteOfDay: number, timeZone: string): number {
  return zonedDateTimeFromMinute(dateInput, minuteOfDay, timeZone).epochMilliseconds;
}

function instantFromInput(instantInput: InstantInput): Temporal.Instant {
  if (typeof instantInput === "number") {
    return TemporalRuntime.Instant.fromEpochMilliseconds(instantInput);
  }
  if (instantInput instanceof Date) {
    return TemporalRuntime.Instant.fromEpochMilliseconds(instantInput.getTime());
  }

  return instantInput;
}

function zonedDateTimeFromMinute(
  dateInput: string,
  minuteOfDay: number,
  timeZone: string,
): Temporal.ZonedDateTime {
  const date = TemporalRuntime.PlainDate.from(dateInput);
  const minute = normalizeMinute(minuteOfDay);

  // Compatible disambiguation matches ordinary calendar behavior around DST gaps and repeats.
  return TemporalRuntime.ZonedDateTime.from(
    {
      day: date.day,
      hour: Math.floor(minute / 60),
      minute: minute % 60,
      month: date.month,
      timeZone,
      year: date.year,
    },
    { disambiguation: "compatible" },
  );
}

function dateDifferenceInDays(fromDateInput: string, toDateInput: string): number {
  return TemporalRuntime.PlainDate.from(toDateInput).since(
    TemporalRuntime.PlainDate.from(fromDateInput),
    {
      largestUnit: "day",
    },
  ).days;
}
