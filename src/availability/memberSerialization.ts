import { memberId, workWindowId } from "./coretimeTypes";
import type { Member, SerializedMember, SerializedWorkWindow, WorkWindow } from "./coretimeTypes";

export function serializeMembers(members: Member[]): SerializedMember[] {
  return members.map(serializeMember);
}

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
