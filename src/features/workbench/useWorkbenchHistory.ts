import type { Ref } from "vue";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { deserializeMembers, serializeMembers } from "../../availability/memberSerialization";
import type { Member, MemberId, SerializedMember } from "../../availability/coretimeTypes";

type HistoryInput = {
  members: Ref<Member[]>;
  minParticipants: Ref<number>;
  selectedMemberId: Ref<MemberId | undefined>;
};

type HistorySnapshot = {
  members: SerializedMember[];
  minParticipants: number;
  selectedMemberId: MemberId | undefined;
};

const HISTORY_LIMIT = 30;

export function useWorkbenchHistory(input: HistoryInput) {
  const undoStack = ref<HistorySnapshot[]>([]);
  const canUndo = computed(() => undoStack.value.length > 0);
  const undoHint = "Cmd+Z can restore recent changes for a while.";

  function captureUndoState(): void {
    undoStack.value = [createSnapshot(), ...undoStack.value].slice(0, HISTORY_LIMIT);
  }

  function undoMut(): void {
    const snapshot = undoStack.value[0];
    if (snapshot === undefined) {
      return;
    }

    undoStack.value = undoStack.value.slice(1);
    input.members.value = deserializeMembers(snapshot.members);
    input.minParticipants.value = Math.min(
      Math.max(1, snapshot.minParticipants),
      Math.max(1, input.members.value.length),
    );
    input.selectedMemberId.value = snapshot.selectedMemberId;
  }

  function createSnapshot(): HistorySnapshot {
    return {
      members: serializeMembers(input.members.value),
      minParticipants: input.minParticipants.value,
      selectedMemberId: input.selectedMemberId.value,
    };
  }

  function handleKeydown(event: KeyboardEvent): void {
    const isUndo = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z";
    if (!isUndo || event.shiftKey || !canUndo.value) {
      return;
    }

    event.preventDefault();
    undoMut();
  }

  onMounted(() => window.addEventListener("keydown", handleKeydown));
  onUnmounted(() => window.removeEventListener("keydown", handleKeydown));

  return {
    canUndo,
    captureUndoState,
    undoHint,
    undoMut,
  };
}
