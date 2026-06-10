import { computed, ref } from "vue";
import type { Member, MemberId } from "../../availability/coretimeTypes";
import type { CoretimeWorkbenchVm } from "../workbench/useCoretimeWorkbench";

type DropPlacement = "before" | "after";

export function usePeopleDrag(vm: CoretimeWorkbenchVm) {
  const draggingMemberId = ref<MemberId | undefined>();
  const dropTargetMemberId = ref<MemberId | undefined>();
  const dropPlacement = ref<DropPlacement>("before");
  const previewMembers = ref<readonly Member[] | undefined>();
  const displayMembers = computed(() => previewMembers.value ?? vm.members.value);

  function startDrag(memberId: MemberId, event: DragEvent): void {
    draggingMemberId.value = memberId;
    previewMembers.value = [...vm.members.value];
    event.dataTransfer?.setData("text/plain", memberId);
    if (event.dataTransfer !== null) {
      event.dataTransfer.effectAllowed = "move";
    }
  }

  function dragOver(targetMemberId: MemberId, event: DragEvent): void {
    if (event.dataTransfer !== null) {
      event.dataTransfer.dropEffect = "move";
    }
    if (draggingMemberId.value === undefined) {
      return;
    }
    if (draggingMemberId.value === targetMemberId) {
      dropTargetMemberId.value = undefined;
      return;
    }

    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const rect = target.getBoundingClientRect();
    const placement = event.clientY > rect.top + rect.height / 2 ? "after" : "before";
    dropTargetMemberId.value = targetMemberId;
    dropPlacement.value = placement;
    movePreview(targetMemberId, placement);
  }

  function dropOn(): void {
    const orderedMemberIds = previewMembers.value?.map((member) => member.id);
    endDrag();
    if (orderedMemberIds !== undefined) {
      vm.reorderMembersMut(orderedMemberIds);
    }
  }

  function endDrag(): void {
    draggingMemberId.value = undefined;
    dropTargetMemberId.value = undefined;
    previewMembers.value = undefined;
  }

  function movePreview(targetMemberId: MemberId, placement: DropPlacement): void {
    const sourceMemberId = draggingMemberId.value;
    const currentMembers = previewMembers.value;
    if (sourceMemberId === undefined || currentMembers === undefined) {
      return;
    }

    const sourceMember = currentMembers.find((member) => member.id === sourceMemberId);
    const membersWithoutSource = currentMembers.filter((member) => member.id !== sourceMemberId);
    const targetIndex = membersWithoutSource.findIndex((member) => member.id === targetMemberId);
    if (sourceMember === undefined || targetIndex < 0) {
      return;
    }

    const insertIndex = placement === "after" ? targetIndex + 1 : targetIndex;
    const nextMembers = [
      ...membersWithoutSource.slice(0, insertIndex),
      sourceMember,
      ...membersWithoutSource.slice(insertIndex),
    ];
    if (!nextMembers.every((member, index) => member.id === currentMembers[index]?.id)) {
      previewMembers.value = nextMembers;
    }
  }

  return {
    displayMembers,
    draggingMemberId,
    dragOver,
    dropOn,
    dropPlacement,
    dropTargetMemberId,
    endDrag,
    startDrag,
  };
}
