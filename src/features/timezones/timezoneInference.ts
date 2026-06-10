import type { TimeZoneCandidate } from "../../availability/coretimeTypes";

type RegionTimeZone = {
  label: string;
  region: string;
  timeZone: string;
  aliases: string[];
};

export const POPULAR_TIME_ZONES = [
  "Africa/Cairo",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Mexico_City",
  "America/New_York",
  "America/Sao_Paulo",
  "America/Toronto",
  "Asia/Bangkok",
  "Asia/Dubai",
  "Asia/Ho_Chi_Minh",
  "Asia/Hong_Kong",
  "Asia/Jakarta",
  "Asia/Kolkata",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Taipei",
  "Asia/Tokyo",
  "Australia/Melbourne",
  "Australia/Sydney",
  "Europe/Amsterdam",
  "Europe/Berlin",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Paris",
  "Europe/Warsaw",
  "Pacific/Auckland",
  "UTC",
];

const zone = (
  label: string,
  region: string,
  timeZone: string,
  aliases: string[],
): RegionTimeZone => ({ aliases, label, region, timeZone });

const REGION_TIME_ZONES: RegionTimeZone[] = [
  zone("Tokyo, Japan", "Japan", "Asia/Tokyo", [
    "tokyo",
    "japan",
    "jp",
    "jst",
    "yokohama",
    "osaka",
    "kyoto",
  ]),
  zone("Seoul, South Korea", "South Korea", "Asia/Seoul", ["seoul", "korea", "south korea", "kr"]),
  zone("Singapore", "Singapore", "Asia/Singapore", ["singapore", "sg"]),
  zone("Taipei, Taiwan", "Taiwan", "Asia/Taipei", ["taipei", "taiwan", "tw"]),
  zone("Hong Kong", "Hong Kong", "Asia/Hong_Kong", ["hong kong", "hk"]),
  zone("Shanghai, China", "China", "Asia/Shanghai", ["shanghai", "beijing", "china", "cn"]),
  zone("Bangkok, Thailand", "Thailand", "Asia/Bangkok", ["bangkok", "thailand", "thai"]),
  zone("Ho Chi Minh City, Vietnam", "Vietnam", "Asia/Ho_Chi_Minh", [
    "ho chi minh",
    "saigon",
    "vietnam",
    "hanoi",
  ]),
  zone("Jakarta, Indonesia", "Indonesia", "Asia/Jakarta", ["jakarta", "indonesia", "id"]),
  zone("Bengaluru, India", "India", "Asia/Kolkata", [
    "bengaluru",
    "bangalore",
    "india",
    "delhi",
    "mumbai",
  ]),
  zone("Dubai, United Arab Emirates", "United Arab Emirates", "Asia/Dubai", [
    "dubai",
    "uae",
    "abu dhabi",
  ]),
  zone("Sydney, Australia", "Australia", "Australia/Sydney", [
    "sydney",
    "australia",
    "nsw",
    "canberra",
  ]),
  zone("Melbourne, Australia", "Australia", "Australia/Melbourne", ["melbourne", "victoria"]),
  zone("Auckland, New Zealand", "New Zealand", "Pacific/Auckland", [
    "auckland",
    "new zealand",
    "nz",
    "wellington",
  ]),
  zone("Berlin, Germany", "Germany", "Europe/Berlin", [
    "berlin",
    "germany",
    "de",
    "munich",
    "hamburg",
  ]),
  zone("Paris, France", "France", "Europe/Paris", ["paris", "france", "fr"]),
  zone("Amsterdam, Netherlands", "Netherlands", "Europe/Amsterdam", [
    "amsterdam",
    "netherlands",
    "nl",
  ]),
  zone("Madrid, Spain", "Spain", "Europe/Madrid", ["madrid", "spain", "es", "barcelona"]),
  zone("Warsaw, Poland", "Poland", "Europe/Warsaw", ["warsaw", "poland", "pl"]),
  zone("London, United Kingdom", "United Kingdom", "Europe/London", [
    "london",
    "uk",
    "united kingdom",
    "england",
    "gb",
    "bst",
    "british summer time",
    "utc+1",
    "utc 1",
  ]),
  zone("New York, United States", "United States", "America/New_York", [
    "new york",
    "nyc",
    "us east",
    "east coast",
    "boston",
  ]),
  zone("Toronto, Canada", "Canada", "America/Toronto", [
    "toronto",
    "canada east",
    "ontario",
    "montreal",
  ]),
  zone("Chicago, United States", "United States", "America/Chicago", [
    "chicago",
    "central",
    "us central",
    "austin",
    "dallas",
  ]),
  zone("Denver, United States", "United States", "America/Denver", [
    "denver",
    "mountain",
    "colorado",
  ]),
  zone("San Francisco, United States", "United States", "America/Los_Angeles", [
    "san francisco",
    "sf",
    "bay area",
    "california",
    "los angeles",
    "la",
    "seattle",
  ]),
  zone("Mexico City, Mexico", "Mexico", "America/Mexico_City", ["mexico city", "mexico", "cdmx"]),
  zone("Sao Paulo, Brazil", "Brazil", "America/Sao_Paulo", ["sao paulo", "brazil", "br", "rio"]),
  zone("Cairo, Egypt", "Egypt", "Africa/Cairo", ["cairo", "egypt"]),
  zone("UTC", "Universal", "UTC", ["utc", "gmt", "remote"]),
];

export function getSupportedTimeZones(): string[] {
  if (typeof Intl.supportedValuesOf === "function") {
    return withUtcFirst(Intl.supportedValuesOf("timeZone"));
  }

  return withUtcFirst(POPULAR_TIME_ZONES);
}

export function isSupportedTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function inferTimeZoneCandidates(
  regionInput: string,
  supportedTimeZones: readonly string[] = getSupportedTimeZones(),
): TimeZoneCandidate[] {
  const query = normalizeRegionQuery(regionInput);
  if (query.length === 0) {
    return [];
  }

  const supported = new Set(supportedTimeZones);
  const byTimeZone = new Map<string, TimeZoneCandidate>();

  for (const candidate of REGION_TIME_ZONES) {
    if (!supported.has(candidate.timeZone)) {
      continue;
    }

    const haystacks = [
      candidate.label,
      candidate.region,
      candidate.timeZone,
      ...candidate.aliases,
    ].map(normalizeRegionQuery);
    const exactAlias = haystacks.some((value) => value === query);
    const prefixAlias = haystacks.some((value) => value.startsWith(query));
    const fuzzyAlias = haystacks.some((value) => value.includes(query));

    if (!exactAlias && !prefixAlias && !fuzzyAlias) {
      continue;
    }

    const score = exactAlias ? 100 : prefixAlias ? 70 : 45;
    const previous = byTimeZone.get(candidate.timeZone);
    if (previous === undefined || previous.score < score) {
      byTimeZone.set(candidate.timeZone, {
        label: candidate.label,
        region: candidate.region,
        score,
        timeZone: candidate.timeZone,
      });
    }
  }

  return [...byTimeZone.values()].sort(
    (a, b) => b.score - a.score || a.label.localeCompare(b.label),
  );
}

export function parseTimeZoneResponse(value: unknown): TimeZoneCandidate[] {
  if (!isRecord(value) || !Array.isArray(value.candidates)) {
    return [];
  }

  return value.candidates.filter(isTimeZoneCandidate);
}

function normalizeRegionQuery(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[_/-]+/g, " ")
    .replace(/\s+/g, " ");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function withUtcFirst(timeZones: readonly string[]): string[] {
  return ["UTC", ...timeZones.filter((timeZone) => timeZone !== "UTC")];
}

function isTimeZoneCandidate(value: unknown): value is TimeZoneCandidate {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.label === "string" &&
    typeof value.region === "string" &&
    typeof value.score === "number" &&
    typeof value.timeZone === "string" &&
    isSupportedTimeZone(value.timeZone)
  );
}
