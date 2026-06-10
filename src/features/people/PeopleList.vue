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

<style scoped>
.panel {
  border: 0;
  padding: 0;
  background: transparent;
}

.section-heading,
.member-row {
  display: flex;
  align-items: center;
}

.section-heading {
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.section-title {
  margin: 0;
  font-size: var(--font-size-heading);
  font-weight: 750;
  text-transform: uppercase;
}

.section-subtitle,
.undo-hint {
  color: var(--color-muted);
  font-size: var(--font-size-lg);
}

.undo-hint {
  margin: 0 0 12px;
}

.member-list {
  display: grid;
  position: relative;
}

.member-row {
  position: relative;
  min-width: 0;
  border-top: 1px solid var(--color-border);
  background: transparent;
  transition:
    background-color 160ms ease,
    opacity 160ms ease;
}

.member-row.dragging {
  background: var(--color-surface-strong);
  opacity: 0.44;
}

.member-row.drop-before::before,
.member-row.drop-after::after {
  position: absolute;
  inset-inline: 32px;
  z-index: var(--z-member-drop);
  height: 1px;
  background: var(--color-ink);
  content: "";
}

.member-row.drop-before::before {
  top: -1px;
}

.member-row.drop-after::after {
  bottom: -1px;
}

.member-move {
  transition: transform 190ms cubic-bezier(0.22, 1, 0.36, 1);
}

.member-enter-active,
.member-leave-active {
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}

.member-enter-from,
.member-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.member-leave-active {
  position: absolute;
  width: 100%;
}

.drag-button,
.delete-button,
.undo-button {
  display: inline-grid;
  place-items: center;
  border: 0;
  color: var(--color-muted);
  background: transparent;
}

.drag-button,
.delete-button {
  width: 32px;
  min-height: 52px;
}

.drag-button {
  cursor: grab;
}

.drag-button.grabbing {
  cursor: grabbing;
}

.undo-button {
  grid-auto-flow: column;
  gap: 6px;
  min-height: 30px;
  border: 1px solid var(--color-border);
  padding: 5px 8px;
  color: var(--color-ink);
  font-weight: 750;
}

.undo-button:disabled {
  color: var(--color-muted);
  opacity: 0.55;
}

.icon {
  width: 17px;
  height: 17px;
  fill: currentColor;
}
</style>
