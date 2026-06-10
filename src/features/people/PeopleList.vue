<script setup lang="ts">
import { mdiDeleteOutline, mdiDragVertical, mdiUndo } from "@mdi/js";
import { computed } from "vue";
import type { Member, MemberId } from "../../availability/coretimeTypes";
import { formatTimeZoneLabel } from "../../availability/timeZoneMath";
import { useCoretimeContext } from "../workbench/coretimeContext";
import MemberNameField from "./MemberNameField.vue";
import { usePeopleDrag } from "./usePeopleDrag";

const vm = useCoretimeContext();
const {
  canUndo,
  members,
  referenceDate,
  removeMemberMut,
  renameMemberMut,
  selectMemberMut,
  selectedMemberId,
  undoHint,
  undoMut,
} = vm;
const {
  displayMembers,
  draggingMemberId,
  dragOver,
  dropOn,
  dropPlacement,
  dropTargetMemberId,
  endDrag,
  startDrag,
} = usePeopleDrag(vm);

const canUndoValue = computed<boolean>(() => canUndo.value);
const displayMemberIndexes = computed<readonly number[]>(() =>
  displayMembers.value.map((_, index) => index),
);
const memberCountLabel = computed<string>(() => `${members.value.length} people`);
const undoHintValue = computed<string>(() => undoHint);

function zoneLabel(timeZone: string): string {
  return formatTimeZoneLabel(timeZone, readReferenceDate());
}

function renameMember(payload: { memberId: MemberId; name: string }): void {
  renameMemberMut(payload.memberId, payload.name);
}

function deleteMember(index: number): void {
  removeMemberMut(displayMemberAt(index).id);
}

function dropMember(): void {
  dropOn();
}

function endMemberDrag(): void {
  endDrag();
}

function displayMemberAt(index: number): Member {
  const member = displayMembers.value[index];
  if (member === undefined) {
    throw new Error(`Missing display member at ${index}.`);
  }

  return member;
}

function dragButtonLabelAt(index: number): string {
  return `Reorder ${displayMemberAt(index).name}`;
}

function dragOverMember(index: number, event: DragEvent): void {
  dragOver(displayMemberAt(index).id, event);
}

function isDraggingAt(index: number): boolean {
  return draggingMemberId.value === displayMemberAt(index).id;
}

function memberDeleteLabelAt(index: number): string {
  return `Delete ${displayMemberAt(index).name}`;
}

function memberIdAt(index: number): MemberId {
  return displayMemberAt(index).id;
}

function memberRowClassAt(index: number): Record<string, boolean> {
  const memberId = memberIdAt(index);

  return {
    dragging: draggingMemberId.value === memberId,
    "drop-after": dropTargetMemberId.value === memberId && dropPlacement.value === "after",
    "drop-before": dropTargetMemberId.value === memberId && dropPlacement.value === "before",
  };
}

function memberSelectedAt(index: number): boolean {
  return selectedMemberId.value === memberIdAt(index);
}

function memberZoneLabelAt(index: number): string {
  return zoneLabel(displayMemberAt(index).homeTimeZone);
}

function readReferenceDate(): string {
  return referenceDate.value;
}

function selectMember(memberId: MemberId): void {
  selectMemberMut(memberId);
}

function startMemberDrag(index: number, event: DragEvent): void {
  startDrag(memberIdAt(index), event);
}

function undo(): void {
  undoMut();
}
</script>

<template>
  <section class="panel people-panel">
    <div class="section-heading">
      <div>
        <p class="section-title">People</p>
        <span class="section-subtitle">{{ memberCountLabel }}</span>
      </div>
      <button class="undo-button" type="button" :disabled="!canUndoValue" @click="undo">
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
          <path :d="mdiUndo" />
        </svg>
        Undo
      </button>
    </div>
    <p class="undo-hint">{{ undoHintValue }}</p>

    <TransitionGroup class="member-list" name="member" tag="div">
      <div
        v-for="index in displayMemberIndexes"
        :key="memberIdAt(index)"
        class="member-row"
        :class="memberRowClassAt(index)"
        @dragenter.prevent="dragOverMember(index, $event)"
        @dragover.prevent="dragOverMember(index, $event)"
        @drop.prevent="dropMember"
      >
        <button
          class="drag-button"
          :class="{ grabbing: isDraggingAt(index) }"
          type="button"
          :aria-label="dragButtonLabelAt(index)"
          draggable="true"
          @dragstart="startMemberDrag(index, $event)"
          @dragend="endMemberDrag"
        >
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path :d="mdiDragVertical" />
          </svg>
        </button>
        <MemberNameField
          :member="displayMemberAt(index)"
          :selected="memberSelectedAt(index)"
          :zone-label="memberZoneLabelAt(index)"
          @rename="renameMember"
          @select="selectMember"
        />
        <button
          class="delete-button"
          type="button"
          :aria-label="memberDeleteLabelAt(index)"
          @click="deleteMember(index)"
        >
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path :d="mdiDeleteOutline" />
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </section>
</template>

<style scoped src="./PeopleList.css"></style>
