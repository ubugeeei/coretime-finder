import { memberId, workWindowId } from "../../availability/coretimeTypes";
import type { Member } from "../../availability/coretimeTypes";
import { serializeMembers } from "../../availability/memberSerialization";
import { getCurrentDateInTimeZone } from "../../availability/timeZoneMath";
import type { WorkbenchBootstrapState } from "./workbenchTypes";

/**
 * The reference zone used when the application opens without a saved profile or a share URL.
 *
 * Keeping this value in the bootstrap module makes the default behavior explicit without tying it
 * to the route layer or the island component. User profiles and shared URLs can still replace the
 * reference zone after hydration.
 */
const STARTER_REFERENCE_TIME_ZONE = "UTC";

/**
 * Builds the canonical state for a first-time Core Time Finder session.
 *
 * This function is intentionally named around the workbench state, not Vue props. The same state
 * can be passed to the island, restored from a share URL, saved as a local profile, or consumed by
 * tests without requiring those callers to know how the UI is mounted.
 */
export function createWorkbenchBootstrapState(): WorkbenchBootstrapState {
  return {
    members: serializeMembers(createStarterMembers()),
    referenceDate: getCurrentDateInTimeZone(STARTER_REFERENCE_TIME_ZONE),
    referenceTimeZone: STARTER_REFERENCE_TIME_ZONE,
  };
}

/**
 * Returns the starter people shown on a clean install.
 *
 * These records are product seed data rather than fallback props. They are kept as real `Member`
 * values until the final serialization step so time-window defaults remain type-checked alongside
 * user-created members.
 */
export function createStarterMembers(): Member[] {
  return [
    starterMember(
      "member-1",
      "ubugeeei",
      "JST",
      "Asia/Tokyo",
      "teal",
      "window-1",
      "Core Time",
      13,
      22,
    ),
    starterMember(
      "member-2",
      "nextrights",
      "San Francisco",
      "America/Los_Angeles",
      "blue",
      "window-2",
      "Work",
      9,
      17,
    ),
    starterMember(
      "member-3",
      "vuerights",
      "Singapore",
      "Asia/Singapore",
      "green",
      "window-3",
      "Work",
      9,
      18,
    ),
    starterMember(
      "member-4",
      "Louis XIV",
      "France",
      "Europe/Paris",
      "rose",
      "window-4",
      "Work",
      9,
      17,
    ),
  ];
}

function starterMember(
  id: string,
  name: string,
  region: string,
  timeZone: string,
  color: Member["color"],
  windowId: string,
  label: string,
  startHour: number,
  endHour: number,
): Member {
  return {
    color,
    homeTimeZone: timeZone,
    id: memberId(id),
    name,
    region,
    windows: [
      {
        endMinute: endHour * 60,
        id: workWindowId(windowId),
        label,
        startMinute: startHour * 60,
        timeZone,
      },
    ],
  };
}
