import { Temporal as TemporalPolyfill } from "@js-temporal/polyfill";
import { normalizeMinute } from "./timeMath";

export type InstantInput = Date | number | Temporal.Instant;

export type LocalDateSnapshot = {
  dayOffset: number;
  isWeekend: boolean;
  localDate: string;
  localDay: string;
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
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

export function getDateInTimeZone(instantInput: InstantInput, timeZone: string): string {
  return instantFromInput(instantInput).toZonedDateTimeISO(timeZone).toPlainDate().toString();
}

export function getCurrentDateInTimeZone(timeZone: string): string {
  return TemporalRuntime.Now.instant().toZonedDateTimeISO(timeZone).toPlainDate().toString();
}

export function getCurrentInstantEpochMilliseconds(): number {
  return TemporalRuntime.Now.instant().epochMilliseconds;
}

export function getCurrentInstantIsoString(): string {
  return TemporalRuntime.Now.instant().toString();
}

export function getLocalMinute(instantInput: InstantInput, timeZone: string): number {
  const zonedDateTime = instantFromInput(instantInput).toZonedDateTimeISO(timeZone);

  return zonedDateTime.hour * 60 + zonedDateTime.minute;
}

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
