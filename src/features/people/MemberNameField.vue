<script setup lang="ts">
import { computed } from "vue";
import type { Member, MemberId } from "../../availability/coretimeTypes";
import { eventStringValue } from "../../shared/forms/formEvents";

const { member, selected, zoneLabel } = defineProps<{
  member: Member;
  selected: boolean;
  zoneLabel: string;
}>();

const emit = defineEmits<{
  rename: [payload: { memberId: MemberId; name: string }];
  select: [memberId: MemberId];
}>();

const memberColor = computed(() => member.color);
const memberName = computed(() => member.name);
const memberRegionLabel = computed(() => member.region || "No region");

function commitName(event: Event): void {
  const name = eventStringValue(event).trim();
  if (name.length === 0) {
    resetInput(event);
    return;
  }

  emit("rename", { memberId: member.id, name });
}

function selectMember(): void {
  emit("select", member.id);
}

function blurInput(event: KeyboardEvent): void {
  if (event.target instanceof HTMLInputElement) {
    event.target.blur();
  }
}

function cancelInput(event: KeyboardEvent): void {
  resetInput(event);
  blurInput(event);
}

function resetInput(event: Event): void {
  if (event.target instanceof HTMLInputElement) {
    event.target.value = memberName.value;
  }
}
</script>

<template>
  <div
    class="member-chip"
    :data-color="memberColor"
    :data-selected="selected ? 'true' : 'false'"
    role="group"
  >
    <span class="member-dot" aria-hidden="true"></span>
    <span class="member-copy">
      <input
        class="member-name-input"
        :aria-label="`Name for ${memberName}`"
        :value="memberName"
        autocomplete="off"
        spellcheck="false"
        @change="commitName"
        @click.stop
        @focus="selectMember"
        @keydown.enter.prevent="blurInput"
        @keydown.escape.prevent="cancelInput"
      />
      <small class="member-meta">{{ memberRegionLabel }} / {{ zoneLabel }}</small>
    </span>
  </div>
</template>

<style scoped>
.member-chip {
  --member-field-font-size: 0.76rem;

  display: grid;
  grid-template-columns: 12px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 52px;
  padding: 10px 12px;
  color: var(--color-ink);
  background: transparent;
}

.member-chip[data-selected="true"] {
  background: var(--color-surface-strong);
}

.member-dot {
  width: 10px;
  height: 10px;
  background: var(--member-color);
}

.member-copy,
.member-meta {
  display: block;
  min-width: 0;
}

.member-name-input {
  width: 100%;
  border: 0;
  border-bottom: 1px solid transparent;
  padding: 0;
  color: var(--color-ink);
  background: transparent;
  font: inherit;
  font-weight: 750;
}

.member-meta {
  overflow: hidden;
  color: var(--color-muted);
  font-size: var(--member-field-font-size);
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
