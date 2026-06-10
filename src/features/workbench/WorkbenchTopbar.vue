<script setup lang="ts">
import { mdiGithub } from "@mdi/js";
import { computed, useId } from "vue";
import { useCoretimeContext } from "../workbench/coretimeContext";
import { eventNumberValue, eventStringValue } from "../../shared/forms/formEvents";
import TimeZoneCombobox from "../timezones/TimeZoneCombobox.vue";

const {
  members,
  minParticipants,
  participantOptions,
  referenceDate,
  referenceTimeZone,
  supportedTimeZones,
} = useCoretimeContext();

const dateId = useId();
const minParticipantsValue = computed<number>(() => minParticipants.value);
const participantOptionIndexes = computed<readonly number[]>(() =>
  participantOptions.value.map((_, index) => index),
);
const participantThresholdId = useId();
const referenceDateValue = computed<string>(() => referenceDate.value);
const referenceTimeZoneId = useId();
const referenceTimeZoneValue = computed<string>(() => referenceTimeZone.value);
const supportedTimeZoneValues = computed<readonly string[]>(() => supportedTimeZones.value);

function memberCountLabel(): number {
  return Math.max(1, members.value.length);
}

function participantLabelAt(index: number): string {
  const count = participantValueAt(index);

  return `${count} / ${memberCountLabel()}`;
}

function participantValueAt(index: number): number {
  return participantOptions.value[index] ?? 1;
}

function updateMinParticipants(event: Event): void {
  minParticipants.value = eventNumberValue(event);
}

function updateReferenceDate(event: Event): void {
  referenceDate.value = eventStringValue(event);
}

function updateReferenceTimeZone(value: string): void {
  referenceTimeZone.value = value;
}
</script>

<template>
  <header class="topbar">
    <div class="brand">
      <span class="brand-mark" aria-hidden="true"></span>
      <div>
        <p class="brand-kicker">Availability overlap</p>
        <div class="title-row">
          <h1 class="brand-title">Core Time Finder</h1>
          <a
            class="github-link"
            href="https://github.com/ubugeeei/coretime-finder"
            target="_blank"
            rel="noreferrer"
            aria-label="Open Core Time Finder on GitHub"
          >
            <svg class="github-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path :d="mdiGithub" />
            </svg>
          </a>
        </div>
      </div>
    </div>

    <div class="topbar-controls" aria-label="Reference controls">
      <div class="field">
        <label :for="dateId">Date</label>
        <input :id="dateId" :value="referenceDateValue" type="date" @input="updateReferenceDate" />
      </div>
      <TimeZoneCombobox
        :id="referenceTimeZoneId"
        label="Reference zone"
        :model-value="referenceTimeZoneValue"
        :reference-date="referenceDateValue"
        :time-zones="supportedTimeZoneValues"
        @update:model-value="updateReferenceTimeZone"
      />
      <div class="field">
        <label :for="participantThresholdId">Threshold</label>
        <select
          :id="participantThresholdId"
          :value="minParticipantsValue"
          @change="updateMinParticipants"
        >
          <option
            v-for="index in participantOptionIndexes"
            :key="participantValueAt(index)"
            :selected="participantValueAt(index) === minParticipantsValue"
            :value="participantValueAt(index)"
          >
            {{ participantLabelAt(index) }}
          </option>
        </select>
      </div>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 28px;
  min-height: 76px;
  border-bottom: 1px solid var(--color-border-strong);
  border-radius: var(--radius);
  padding: 0 0 22px;
  background: transparent;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 240px;
}

.brand-kicker,
.brand-title {
  margin: 0;
}

.brand-kicker {
  color: var(--color-muted);
  font-size: var(--font-size-md);
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.brand-title {
  font-size: var(--font-size-brand-title);
  line-height: 1.1;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.github-link {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border: 1px solid var(--color-border-strong);
  color: var(--color-ink);
  background: transparent;
}

.github-link:hover {
  color: var(--color-bg);
  background: var(--color-ink);
}

.github-icon {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.brand-mark {
  width: 42px;
  height: 42px;
  border: 1px solid var(--color-ink);
  border-radius: 0;
  background:
    linear-gradient(90deg, transparent 0 29%, #f2f2ec 29% 34%, transparent 34%),
    linear-gradient(90deg, transparent 0 58%, #8c8c84 58% 63%, transparent 63%),
    linear-gradient(180deg, transparent 0 49%, var(--color-border) 49% 51%, transparent 51%),
    var(--color-surface);
}

.topbar-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 160px), 1fr));
  gap: 12px;
  width: min(680px, 100%);
}
</style>
