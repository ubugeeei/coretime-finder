import { formatTimeZoneLabel, formatTimeZoneOffset } from "../../availability/timeZoneMath";

/** Curated map/search metadata for time zones that are useful in a distributed-team planner. */
type CatalogEntry = {
  timeZone: string;
  city: string;
  region: string;
  aliases: string[];
  x: number;
  y: number;
};

/** Picker-ready time zone entry with labels calculated for the active reference date. */
export type TimeZonePickerOption = CatalogEntry & {
  label: string;
  offset: string;
};

function zone(
  timeZone: string,
  city: string,
  region: string,
  aliases: string[],
  longitude: number,
  latitude: number,
): CatalogEntry {
  return {
    aliases,
    city,
    region,
    timeZone,
    x: projectLongitude(longitude),
    y: projectLatitude(latitude),
  };
}

function projectLongitude(longitude: number): number {
  return ((longitude + 180) / 360) * 100;
}

function projectLatitude(latitude: number): number {
  return ((90 - latitude) / 180) * 100;
}

/**
 * A compact catalog of common collaboration zones.
 *
 * The runtime still accepts any supported IANA zone; this list only provides friendly city labels,
 * map points, and aliases for the most likely choices.
 */
const TIME_ZONE_CATALOG: CatalogEntry[] = [
  zone("UTC", "Greenwich", "Universal", ["gmt", "greenwich", "remote"], 0, 51.5),
  zone("Africa/Cairo", "Cairo", "Egypt", ["egypt", "eg"], 31.24, 30.04),
  zone(
    "America/Chicago",
    "Chicago",
    "United States",
    ["usa", "us", "central", "texas"],
    -87.63,
    41.88,
  ),
  zone(
    "America/Denver",
    "Denver",
    "United States",
    ["usa", "us", "mountain", "colorado"],
    -104.99,
    39.74,
  ),
  zone(
    "America/Los_Angeles",
    "San Francisco",
    "United States",
    ["usa", "us", "california", "sf", "los angeles", "seattle"],
    -122.42,
    37.77,
  ),
  zone("America/Mexico_City", "Mexico City", "Mexico", ["mexico", "cdmx"], -99.13, 19.43),
  zone("America/New_York", "New York", "United States", ["usa", "us", "east coast"], -74.01, 40.71),
  zone("America/Sao_Paulo", "Sao Paulo", "Brazil", ["brazil", "br", "rio"], -46.63, -23.55),
  zone("America/Toronto", "Toronto", "Canada", ["canada", "ontario", "montreal"], -79.38, 43.65),
  zone("Asia/Bangkok", "Bangkok", "Thailand", ["thailand", "thai"], 100.5, 13.75),
  zone("Asia/Dubai", "Dubai", "United Arab Emirates", ["uae", "abu dhabi"], 55.27, 25.2),
  zone("Asia/Ho_Chi_Minh", "Ho Chi Minh City", "Vietnam", ["vietnam", "hanoi"], 106.63, 10.82),
  zone("Asia/Hong_Kong", "Hong Kong", "Hong Kong", ["hk", "china"], 114.17, 22.32),
  zone("Asia/Jakarta", "Jakarta", "Indonesia", ["indonesia", "id"], 106.85, -6.21),
  zone("Asia/Kolkata", "Bengaluru", "India", ["india", "delhi", "mumbai"], 77.59, 12.97),
  zone("Asia/Seoul", "Seoul", "South Korea", ["korea", "south korea", "kr"], 126.98, 37.57),
  zone("Asia/Shanghai", "Shanghai", "China", ["china", "beijing", "cn"], 121.47, 31.23),
  zone("Asia/Singapore", "Singapore", "Singapore", ["sg"], 103.85, 1.29),
  zone("Asia/Taipei", "Taipei", "Taiwan", ["taiwan", "tw"], 121.56, 25.03),
  zone("Asia/Tokyo", "Tokyo", "Japan", ["japan", "jp", "jst", "osaka"], 139.69, 35.69),
  zone("Australia/Melbourne", "Melbourne", "Australia", ["australia", "victoria"], 144.96, -37.81),
  zone("Australia/Sydney", "Sydney", "Australia", ["australia", "nsw", "canberra"], 151.21, -33.87),
  zone("Europe/Amsterdam", "Amsterdam", "Netherlands", ["netherlands", "nl"], 4.9, 52.37),
  zone("Europe/Berlin", "Berlin", "Germany", ["germany", "de", "munich"], 13.4, 52.52),
  zone(
    "Europe/London",
    "London",
    "United Kingdom",
    ["uk", "england", "gb", "bst", "british summer time", "utc+1", "utc 1"],
    -0.13,
    51.51,
  ),
  zone("Europe/Madrid", "Madrid", "Spain", ["spain", "es", "barcelona"], -3.7, 40.42),
  zone("Europe/Paris", "Paris", "France", ["france", "fr"], 2.35, 48.86),
  zone("Europe/Warsaw", "Warsaw", "Poland", ["poland", "pl"], 21.01, 52.23),
  zone("Pacific/Auckland", "Auckland", "New Zealand", ["new zealand", "nz"], 174.76, -36.85),
];

export function buildTimeZonePickerOptions(
  timeZones: readonly string[],
  referenceDate: string,
): TimeZonePickerOption[] {
  const catalogByZone = new Map(TIME_ZONE_CATALOG.map((entry) => [entry.timeZone, entry]));

  return timeZones.map((timeZone) => {
    const entry = catalogByZone.get(timeZone) ?? fallbackEntry(timeZone);

    return {
      ...entry,
      label: formatTimeZoneLabel(timeZone, referenceDate),
      offset: formatTimeZoneOffset(timeZone, referenceDate),
    };
  });
}

/** Filters and ranks picker options by city, region, IANA name, offset, and aliases. */
export function filterTimeZonePickerOptions(
  options: readonly TimeZonePickerOption[],
  queryInput: string,
): TimeZonePickerOption[] {
  const query = normalize(queryInput);
  if (query.length === 0) {
    return options.slice(0, 40);
  }

  return options
    .map((option) => ({ option, score: scoreOption(option, query) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.option.label.localeCompare(b.option.label))
    .map((entry) => entry.option)
    .slice(0, 40);
}

export function mapTimeZonePickerOptions(
  options: readonly TimeZonePickerOption[],
): TimeZonePickerOption[] {
  return options.filter((option) => option.x > 0 && option.y > 0);
}

/** Creates a search-only option for supported zones outside the curated map catalog. */
function fallbackEntry(timeZone: string): CatalogEntry {
  const parts = timeZone.split("/");
  const city = (parts.at(-1) ?? timeZone).replace(/_/g, " ");
  const region = parts.length > 1 ? (parts[0] ?? "Other") : "Other";

  return {
    aliases: [city, region],
    city,
    region,
    timeZone,
    x: 0,
    y: 0,
  };
}

/** Scores exact matches above prefix matches and broad substring matches. */
function scoreOption(option: TimeZonePickerOption, query: string): number {
  const values = [
    option.timeZone,
    option.label,
    option.offset,
    option.city,
    option.region,
    ...option.aliases,
  ].map(normalize);

  if (values.some((value) => value === query)) {
    return 120;
  }
  if (values.some((value) => value.startsWith(query))) {
    return 80;
  }
  if (values.some((value) => value.includes(query))) {
    return 40;
  }

  return 0;
}

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[_/-]+/g, " ")
    .replace(/\s+/g, " ");
}
