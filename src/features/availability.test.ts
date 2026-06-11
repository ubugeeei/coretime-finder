import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildAvailabilitySlots,
  buildMemberTimelines,
  bestCandidate,
  findCandidateIntervals,
} from "../availability/coretimeModel";
import { memberId, workWindowId } from "../availability/coretimeTypes";
import type { Member } from "../availability/coretimeTypes";
import { deserializeMembers } from "../availability/memberSerialization";
import { dayPhaseForMinute, parseClock } from "../availability/timeMath";
import {
  formatTimeZoneLabel,
  formatTimeZoneOffset,
  getLocalDateSnapshot,
  zonedTimeToUtcMs,
} from "../availability/timeZoneMath";
import {
  decodeShareSnapshot,
  encodeShareSnapshot,
  readStoredProfiles,
  writeStoredProfiles,
} from "./profiles/workbenchPersistence";
import {
  buildTimeZonePickerOptions,
  filterTimeZonePickerOptions,
} from "./timezones/timeZonePicker";
import { getSupportedTimeZones, inferTimeZoneCandidates } from "./timezones/timezoneInference";
import { createWorkbenchBootstrapState } from "./workbench/workbenchBootstrap";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("inferTimeZoneCandidates", () => {
  it("infers common city names", () => {
    expect(inferTimeZoneCandidates("San Francisco")[0]?.timeZone).toBe("America/Los_Angeles");
    expect(inferTimeZoneCandidates("Tokyo")[0]?.timeZone).toBe("Asia/Tokyo");
    expect(inferTimeZoneCandidates("Singapore")[0]?.timeZone).toBe("Asia/Singapore");
    expect(inferTimeZoneCandidates("France")[0]?.timeZone).toBe("Europe/Paris");
  });

  it("returns no candidates for blank input", () => {
    expect(inferTimeZoneCandidates("   ")).toEqual([]);
  });
});

describe("createWorkbenchBootstrapState", () => {
  it("uses UTC as the default reference timezone", () => {
    expect(createWorkbenchBootstrapState().referenceTimeZone).toBe("UTC");
  });

  it("uses the requested default sample members", () => {
    const members = createWorkbenchBootstrapState().members;

    expect(members.map((member) => member.name)).toEqual([
      "ubugeeei",
      "nextrights",
      "vuerights",
      "Louis XIV",
    ]);
    expect(members.map((member) => member.region)).toEqual([
      "JST",
      "San Francisco",
      "Singapore",
      "France",
    ]);
    expect(members.map((member) => member.homeTimeZone)).toEqual([
      "Asia/Tokyo",
      "America/Los_Angeles",
      "Asia/Singapore",
      "Europe/Paris",
    ]);
    expect(members[0]?.windows[0]).toMatchObject({
      endMinute: 22 * 60,
      label: "Core Time",
      startMinute: 13 * 60,
      timeZone: "Asia/Tokyo",
    });
  });
});

describe("formatTimeZoneOffset", () => {
  it("formats UTC offsets with sign and minutes", () => {
    expect(formatTimeZoneOffset("UTC", "2026-06-10")).toBe("UTC+00:00");
    expect(formatTimeZoneLabel("Asia/Tokyo", "2026-06-10")).toBe("Asia/Tokyo (UTC+09:00)");
  });
});

describe("Temporal time zone conversion", () => {
  it("converts local wall clock time to an instant", () => {
    expect(new Date(zonedTimeToUtcMs("2026-06-10", 9 * 60, "Asia/Tokyo")).toISOString()).toBe(
      "2026-06-10T00:00:00.000Z",
    );
  });

  it("captures local weekend day shifts", () => {
    expect(
      getLocalDateSnapshot(new Date("2026-06-12T16:00:00.000Z"), "Asia/Tokyo", "2026-06-12"),
    ).toEqual({
      dayOffset: 1,
      isWeekend: true,
      localDate: "2026-06-13",
      localDay: "Sat",
    });
  });
});

describe("getSupportedTimeZones", () => {
  it("keeps UTC first for default select rendering", () => {
    expect(getSupportedTimeZones()[0]).toBe("UTC");
  });
});

describe("time zone picker search", () => {
  it("matches country names and keeps map coordinates", () => {
    const options = buildTimeZonePickerOptions(
      ["Asia/Tokyo", "Europe/Paris", "Europe/London", "America/Los_Angeles"],
      "2026-06-10",
    );

    expect(filterTimeZonePickerOptions(options, "Japan")[0]?.timeZone).toBe("Asia/Tokyo");
    expect(filterTimeZonePickerOptions(options, "France")[0]?.timeZone).toBe("Europe/Paris");
    expect(filterTimeZonePickerOptions(options, "United States")[0]?.timeZone).toBe(
      "America/Los_Angeles",
    );
    expect(filterTimeZonePickerOptions(options, "BST")[0]?.timeZone).toBe("Europe/London");
    expect(options.every((option) => option.x > 0 && option.y > 0)).toBe(true);
  });
});

describe("share snapshots", () => {
  it("round-trips a workbench snapshot through a URL-safe payload", () => {
    const snapshot = {
      members: createWorkbenchBootstrapState().members,
      minParticipants: 2,
      referenceDate: "2026-06-10",
      referenceTimeZone: "UTC",
      version: 1 as const,
    };
    const encoded = encodeShareSnapshot(snapshot);

    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(decodeShareSnapshot(encoded)).toEqual(snapshot);
  });
});

describe("local profile storage", () => {
  it("writes and reads saved profiles", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: vi.fn((key: string) => store.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => store.set(key, value)),
    };
    const profile = {
      id: "profile-1",
      name: "Night handoff",
      snapshot: {
        members: createWorkbenchBootstrapState().members,
        minParticipants: 3,
        referenceDate: "2026-06-10",
        referenceTimeZone: "UTC",
        version: 1 as const,
      },
      updatedAt: "2026-06-10T10:00:00.000Z",
    };

    vi.stubGlobal("localStorage", storage);
    writeStoredProfiles([profile]);

    expect(readStoredProfiles()).toEqual([profile]);
  });
});

describe("parseClock", () => {
  it("parses 24 hour clock values", () => {
    expect(parseClock("09:30")).toBe(570);
    expect(parseClock("23:59")).toBe(1439);
  });

  it("rejects invalid clock values", () => {
    expect(parseClock("24:00")).toBeUndefined();
    expect(parseClock("9:30")).toBeUndefined();
  });
});

describe("day phase snapshots", () => {
  it("uses the current instant for member status pills", () => {
    const [member] = deserializeMembers(createWorkbenchBootstrapState().members);
    const [timeline] = buildMemberTimelines({
      members: member === undefined ? [] : [member],
      phaseReferenceInstant: new Date("2026-06-10T11:00:00.000Z"),
      referenceDate: "2026-06-10",
      referenceTimeZone: "UTC",
      stepMinutes: 60,
    });

    expect(timeline?.phaseSnapshot).toMatchObject({
      isWeekend: false,
      localDate: "2026-06-10",
      localDay: "Wed",
      localTime: "20:00",
      phase: "night",
    });
    expect(dayPhaseForMinute(20 * 60)).toBe("night");
  });

  it("marks weekend shifts on timeline day segments", () => {
    const [member] = deserializeMembers(createWorkbenchBootstrapState().members);
    const [timeline] = buildMemberTimelines({
      members: member === undefined ? [] : [member],
      phaseReferenceInstant: new Date("2026-06-12T12:00:00.000Z"),
      referenceDate: "2026-06-12",
      referenceTimeZone: "UTC",
      stepMinutes: 60,
    });

    const weekendSegment = timeline?.phaseSegments.find(function findWeekendSegment(segment) {
      return segment.isWeekend;
    });

    expect(weekendSegment).toMatchObject({
      dayOffset: 1,
      isWeekend: true,
      localDate: "2026-06-13",
      localDay: "Sat",
    });
  });
});

describe("coretime calculation", () => {
  it("finds a two-person overlap in the reference timezone", () => {
    const members: Member[] = [
      {
        id: memberId("tokyo"),
        name: "Tokyo",
        region: "Tokyo",
        homeTimeZone: "Asia/Tokyo",
        color: "teal",
        windows: [
          {
            id: workWindowId("tokyo-window"),
            label: "Office",
            timeZone: "Asia/Tokyo",
            startMinute: 9 * 60,
            endMinute: 18 * 60,
          },
        ],
      },
      {
        id: memberId("berlin"),
        name: "Berlin",
        region: "Berlin",
        homeTimeZone: "Europe/Berlin",
        color: "blue",
        windows: [
          {
            id: workWindowId("berlin-window"),
            label: "Studio",
            timeZone: "Europe/Berlin",
            startMinute: 8 * 60,
            endMinute: 16 * 60,
          },
        ],
      },
    ];

    const slots = buildAvailabilitySlots({
      members,
      referenceDate: "2026-06-10",
      referenceTimeZone: "Asia/Tokyo",
      stepMinutes: 60,
    });
    const candidates = findCandidateIntervals(slots, 2);

    expect(bestCandidate(candidates)).toMatchObject({
      count: 2,
      endMinute: 18 * 60,
      startMinute: 15 * 60,
    });
  });
});
