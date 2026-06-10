import { memberId, workWindowId } from "./coretimeTypes";
import type { Member, SerializedMember, SerializedWorkWindow, WorkWindow } from "./coretimeTypes";

/**
 * Converts live member records into plain JSON-safe objects for profiles and share URLs.
 *
 * Branded ids are intentionally erased here because the serialized shape crosses storage and URL
 * boundaries where TypeScript brands have no meaning.
 */
export function serializeMembers(members: Member[]): SerializedMember[] {
  return members.map(serializeMember);
}

/**
 * Restores serialized members into the domain shape used by the calculator and UI.
 *
 * This is the single place where string ids from storage are re-branded as member/window ids.
 */
export function deserializeMembers(members: SerializedMember[]): Member[] {
  return members.map(deserializeMember);
}

function serializeMember(member: Member): SerializedMember {
  return {
    color: member.color,
    homeTimeZone: member.homeTimeZone,
    id: member.id,
    name: member.name,
    region: member.region,
    windows: member.windows.map(serializeWorkWindow),
  };
}

function serializeWorkWindow(workWindow: WorkWindow): SerializedWorkWindow {
  return {
    endMinute: workWindow.endMinute,
    id: workWindow.id,
    label: workWindow.label,
    startMinute: workWindow.startMinute,
    timeZone: workWindow.timeZone,
  };
}

function deserializeMember(member: SerializedMember): Member {
  return {
    color: member.color,
    homeTimeZone: member.homeTimeZone,
    id: memberId(member.id),
    name: member.name,
    region: member.region,
    windows: member.windows.map(deserializeWorkWindow),
  };
}

function deserializeWorkWindow(workWindow: SerializedWorkWindow): WorkWindow {
  return {
    endMinute: workWindow.endMinute,
    id: workWindowId(workWindow.id),
    label: workWindow.label,
    startMinute: workWindow.startMinute,
    timeZone: workWindow.timeZone,
  };
}
