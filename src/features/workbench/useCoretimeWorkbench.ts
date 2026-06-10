import { computed, ref } from "vue";
import type { Member, MemberId, WorkWindow } from "../../availability/coretimeTypes";
import { MEMBER_COLORS, memberId, workWindowId } from "../../availability/coretimeTypes";
import {
  buildAvailabilitySlots,
  buildMemberTimelines,
  bestCandidate,
  findCandidateIntervals,
} from "../../availability/coretimeModel";
import { deserializeMembers } from "../../availability/memberSerialization";
import { parseClock } from "../../availability/timeMath";
import { getSupportedTimeZones, isSupportedTimeZone } from "../timezones/timezoneInference";
import { useCurrentInstant } from "./useCurrentInstant";
import { useMemberTimeZoneInference } from "./useMemberTimeZoneInference";
import { useWorkbenchProfiles } from "../profiles/useWorkbenchProfiles";
import { useWorkbenchHistory } from "./useWorkbenchHistory";
import type { DraftError, WorkbenchBootstrapState } from "./workbenchTypes";

export type CoretimeWorkbenchVm = ReturnType<typeof useCoretimeWorkbench>;

/**
 * Creates the reactive view model for the full workbench.
 *
 * The input is a normalized bootstrap state, not Vue props. Keeping the composable on that boundary
 * makes it reusable from SSR, tests, future import flows, and share URL restoration without leaking
 * route or island implementation details into the core editing logic.
 */
export function useCoretimeWorkbench(bootstrapState: WorkbenchBootstrapState) {
  const members = ref<Member[]>(deserializeMembers(bootstrapState.members));
  const referenceDate = ref<string>(bootstrapState.referenceDate);
  const referenceTimeZone = ref<string>(bootstrapState.referenceTimeZone);
  const minParticipants = ref<number>(Math.min(2, Math.max(1, bootstrapState.members.length)));
  const selectedMemberId = ref<MemberId | undefined>(members.value[0]?.id);

  const memberName = ref<string>("");
  const memberRegion = ref<string>("");
  const memberTimeZone = ref<string>(bootstrapState.referenceTimeZone);
  const memberStart = ref<string>("09:00");
  const memberEnd = ref<string>("17:00");
  const memberDraftError = ref<DraftError>({ status: "none" });

  const windowLabel = ref<string>("Office");
  const windowTimeZone = ref<string>(bootstrapState.referenceTimeZone);
  const windowStart = ref<string>("09:00");
  const windowEnd = ref<string>("17:00");
  const windowDraftError = ref<DraftError>({ status: "none" });
  const currentInstant = useCurrentInstant();

  let nextMemberIndex = bootstrapState.members.length + 1;
  let nextWindowIndex = bootstrapState.members.flatMap((member) => member.windows).length + 1;

  const stepMinutes = 30;
  const supportedTimeZones = computed(() => getSupportedTimeZones());
  const selectedMember = computed(() =>
    members.value.find((member) => member.id === selectedMemberId.value),
  );
  const participantOptions = computed(() =>
    Array.from({ length: Math.max(1, members.value.length) }, (_, index) => index + 1),
  );
  const coverageSlots = computed(() =>
    buildAvailabilitySlots({
      members: members.value,
      referenceDate: referenceDate.value,
      referenceTimeZone: referenceTimeZone.value,
      stepMinutes,
    }),
  );
  const candidateIntervals = computed(() =>
    findCandidateIntervals(coverageSlots.value, minParticipants.value),
  );
  const featuredCandidate = computed(() => bestCandidate(candidateIntervals.value));
  const memberTimelines = computed(() =>
    buildMemberTimelines({
      members: members.value,
      phaseReferenceInstant: currentInstant.value,
      referenceDate: referenceDate.value,
      referenceTimeZone: referenceTimeZone.value,
      stepMinutes,
    }),
  );
  const hourMarks = computed(() =>
    Array.from({ length: 25 }, (_, hour) => ({
      label: hour === 24 ? "24" : String(hour).padStart(2, "0"),
      minute: hour * 60,
    })),
  );
  const maxCoverage = computed(() =>
    coverageSlots.value.reduce((max, slot) => Math.max(max, slot.count), 0),
  );
  const totalCandidateMinutes = computed(() =>
    candidateIntervals.value.reduce((total, candidate) => total + candidate.durationMinutes, 0),
  );
  const profileVm = useWorkbenchProfiles({
    members,
    minParticipants,
    referenceDate,
    referenceTimeZone,
    selectedMemberId,
  });
  const { captureUndoState, ...historyVm } = useWorkbenchHistory({
    members,
    minParticipants,
    selectedMemberId,
  });
  const inferenceVm = useMemberTimeZoneInference({
    memberRegion,
    memberTimeZone,
    supportedTimeZones,
    windowTimeZone,
  });

  function addMemberMut() {
    const name = memberName.value.trim();
    const region = memberRegion.value.trim();
    const startMinute = parseClock(memberStart.value);
    const endMinute = parseClock(memberEnd.value);

    if (name.length === 0) {
      memberDraftError.value = { status: "invalid", message: "Name is required." };
      return;
    }
    if (!isSupportedTimeZone(memberTimeZone.value)) {
      memberDraftError.value = { status: "invalid", message: "Choose a valid IANA time zone." };
      return;
    }
    if (startMinute === undefined || endMinute === undefined || startMinute === endMinute) {
      memberDraftError.value = { status: "invalid", message: "Use a valid non-empty work window." };
      return;
    }

    const member: Member = {
      color: MEMBER_COLORS[(nextMemberIndex - 1) % MEMBER_COLORS.length] ?? "teal",
      homeTimeZone: memberTimeZone.value,
      id: memberId(`member-${nextMemberIndex}`),
      name,
      region,
      windows: [
        {
          endMinute,
          id: workWindowId(`window-${nextWindowIndex}`),
          label: "Primary",
          startMinute,
          timeZone: memberTimeZone.value,
        },
      ],
    };

    captureUndoState();
    nextMemberIndex += 1;
    captureUndoState();
    nextWindowIndex += 1;
    members.value = [...members.value, member];
    selectedMemberId.value = member.id;
    memberName.value = "";
    memberRegion.value = "";
    memberDraftError.value = { status: "none" };
    minParticipants.value = Math.min(minParticipants.value || 1, members.value.length);
  }

  function addWorkWindowMut() {
    const member = selectedMember.value;
    const startMinute = parseClock(windowStart.value);
    const endMinute = parseClock(windowEnd.value);
    const label = windowLabel.value.trim() || "Window";

    if (member === undefined) {
      windowDraftError.value = { status: "invalid", message: "Select a member first." };
      return;
    }
    if (!isSupportedTimeZone(windowTimeZone.value)) {
      windowDraftError.value = { status: "invalid", message: "Choose a valid IANA time zone." };
      return;
    }
    if (startMinute === undefined || endMinute === undefined || startMinute === endMinute) {
      windowDraftError.value = { status: "invalid", message: "Use a valid non-empty work window." };
      return;
    }

    const window: WorkWindow = {
      endMinute,
      id: workWindowId(`window-${nextWindowIndex}`),
      label,
      startMinute,
      timeZone: windowTimeZone.value,
    };

    nextWindowIndex += 1;
    members.value = members.value.map((candidate) =>
      candidate.id === member.id
        ? { ...candidate, windows: [...candidate.windows, window] }
        : candidate,
    );
    windowDraftError.value = { status: "none" };
  }

  function removeMemberMut(memberIdToRemove: MemberId) {
    captureUndoState();
    members.value = members.value.filter((member) => member.id !== memberIdToRemove);
    if (selectedMemberId.value === memberIdToRemove) {
      selectedMemberId.value = members.value[0]?.id;
    }
    minParticipants.value = Math.min(
      Math.max(1, minParticipants.value),
      Math.max(1, members.value.length),
    );
  }

  function removeWorkWindowMut(memberIdToUpdate: MemberId, windowIdToRemove: string) {
    captureUndoState();
    members.value = members.value.map((member) =>
      member.id === memberIdToUpdate
        ? { ...member, windows: member.windows.filter((window) => window.id !== windowIdToRemove) }
        : member,
    );
  }

  function selectMemberMut(memberIdToSelect: MemberId) {
    selectedMemberId.value = memberIdToSelect;
  }

  function renameMemberMut(memberIdToRename: MemberId, nextNameInput: string) {
    const nextName = nextNameInput.trim();
    if (nextName.length === 0) {
      return;
    }

    const member = members.value.find((candidate) => candidate.id === memberIdToRename);
    if (member === undefined || member.name === nextName) {
      return;
    }

    captureUndoState();
    members.value = members.value.map((candidate) =>
      candidate.id === memberIdToRename ? { ...candidate, name: nextName } : candidate,
    );
  }

  function reorderMembersMut(orderedMemberIds: readonly MemberId[]) {
    if (orderedMemberIds.length !== members.value.length) {
      return;
    }

    const memberById = new Map(members.value.map((member) => [member.id, member]));
    const nextMembers: Member[] = [];
    for (const orderedMemberId of orderedMemberIds) {
      const member = memberById.get(orderedMemberId);
      if (member === undefined || nextMembers.includes(member)) {
        return;
      }
      nextMembers.push(member);
    }
    if (!nextMembers.every((member, index) => member.id === members.value[index]?.id)) {
      captureUndoState();
      members.value = nextMembers;
    }
  }

  return {
    addMemberMut,
    addWorkWindowMut,
    ...historyVm,
    ...inferenceVm,
    ...profileVm,
    candidateIntervals,
    coverageSlots,
    featuredCandidate,
    hourMarks,
    maxCoverage,
    memberDraftError,
    memberEnd,
    memberName,
    memberRegion,
    memberStart,
    memberTimeZone,
    memberTimelines,
    members,
    minParticipants,
    participantOptions,
    referenceDate,
    referenceTimeZone,
    reorderMembersMut,
    renameMemberMut,
    removeMemberMut,
    removeWorkWindowMut,
    selectMemberMut,
    selectedMember,
    selectedMemberId,
    supportedTimeZones,
    totalCandidateMinutes,
    windowDraftError,
    windowEnd,
    windowLabel,
    windowStart,
    windowTimeZone,
  };
}
