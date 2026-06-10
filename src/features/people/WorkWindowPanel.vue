<script setup lang="ts">
import { mdiDeleteOutline } from "@mdi/js";
import { computed, useId } from "vue";
import { formatMinuteRange } from "../../availability/timeMath";
import { formatTimeZoneLabel } from "../../availability/timeZoneMath";
import { useCoretimeContext } from "../workbench/coretimeContext";
import { eventStringValue } from "../../shared/forms/formEvents";
import TimeZoneCombobox from "../timezones/TimeZoneCombobox.vue";

const {
  addWorkWindowMut,
  referenceDate,
  removeMemberMut,
  removeWorkWindowMut,
  selectedMember,
  supportedTimeZones,
  windowDraftError,
  windowEnd,
  windowLabel,
  windowStart,
  windowTimeZone,
} = useCoretimeContext();

const hasSelectedMember = computed<boolean>(() => selectedMember.value !== undefined);
const homeZoneLabel = computed<string>(() => {
  const member = selectedMember.value;

  return member === undefined ? "" : formatTimeZoneLabel(member.homeTimeZone, readReferenceDate());
});
const referenceDateValue = computed<string>(() => referenceDate.value);
const selectedMemberColor = computed<string>(() => selectedMember.value?.color ?? "teal");
const selectedMemberName = computed<string>(() => selectedMember.value?.name ?? "");
const supportedTimeZoneValues = computed<readonly string[]>(() => supportedTimeZones.value);
const windowDraftErrorLabel = computed<string>(() =>
  windowDraftError.value.status === "invalid" ? windowDraftError.value.message : "",
);
const windowEndId = useId();
const windowEndValue = computed<string>(() => windowEnd.value);
const windowIndexes = computed<readonly number[]>(() =>
  (selectedMember.value?.windows ?? []).map((_, index) => index),
);
const windowLabelId = useId();
const windowLabelValue = computed<string>(() => windowLabel.value);
const windowStartId = useId();
const windowStartValue = computed<string>(() => windowStart.value);
const windowTimeZoneId = useId();
const windowTimeZoneValue = computed<string>(() => windowTimeZone.value);

function addWorkWindow(): void {
  addWorkWindowMut();
}

function readReferenceDate(): string {
  return referenceDate.value;
}

function removeSelectedMember(): void {
  const member = selectedMember.value;
  if (member !== undefined) {
    removeMemberMut(member.id);
  }
}

function removeWorkWindow(index: number): void {
  const member = selectedMember.value;
  const workWindow = member?.windows[index];
  if (member !== undefined && workWindow !== undefined) {
    removeWorkWindowMut(member.id, workWindow.id);
  }
}

function updateWindowEnd(event: Event): void {
  windowEnd.value = eventStringValue(event);
}

function updateWindowLabel(event: Event): void {
  windowLabel.value = eventStringValue(event);
}

function updateWindowStart(event: Event): void {
  windowStart.value = eventStringValue(event);
}

function updateWindowTimeZone(value: string): void {
  windowTimeZone.value = value;
}

function windowIdAt(index: number): string {
  return selectedMember.value?.windows[index]?.id ?? String(index);
}

function windowLabelAt(index: number): string {
  return selectedMember.value?.windows[index]?.label ?? "";
}

function windowRangeAt(index: number): string {
  const workWindow = selectedMember.value?.windows[index];

  return workWindow === undefined
    ? ""
    : formatMinuteRange(workWindow.startMinute, workWindow.endMinute);
}

function windowRemoveLabelAt(index: number): string {
  return `Remove ${windowLabelAt(index)}`;
}

function windowTimeZoneLabelAt(index: number): string {
  const workWindow = selectedMember.value?.windows[index];

  return workWindow === undefined
    ? ""
    : formatTimeZoneLabel(workWindow.timeZone, readReferenceDate());
}
</script>

<template>
  <section class="panel">
    <div class="section-heading">
      <p class="section-title">Working windows</p>
      <span v-if="hasSelectedMember" class="section-subtitle">{{ selectedMemberName }}</span>
    </div>

    <template v-if="hasSelectedMember">
      <div class="home-zone" :data-color="selectedMemberColor">
        <span class="member-dot" aria-hidden="true"></span>
        <div>
          <strong>Home zone</strong>
          <span class="home-zone-label">{{ homeZoneLabel }}</span>
        </div>
      </div>

      <div class="window-list">
        <div
          v-for="index in windowIndexes"
          :key="windowIdAt(index)"
          class="window-item"
          :data-color="selectedMemberColor"
        >
          <div>
            <strong>{{ windowLabelAt(index) }}</strong>
            <span class="window-range">{{ windowRangeAt(index) }}</span>
            <small class="window-zone">{{ windowTimeZoneLabelAt(index) }}</small>
          </div>
          <button
            class="icon-button"
            type="button"
            :aria-label="windowRemoveLabelAt(index)"
            @click="removeWorkWindow(index)"
          >
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path :d="mdiDeleteOutline" />
            </svg>
          </button>
        </div>
      </div>

      <form class="stack-form compact">
        <div class="field">
          <label :for="windowLabelId">Label</label>
          <input
            :id="windowLabelId"
            :value="windowLabelValue"
            autocomplete="off"
            @input="updateWindowLabel"
          />
        </div>
        <TimeZoneCombobox
          :id="windowTimeZoneId"
          label="Time zone"
          :model-value="windowTimeZoneValue"
          :reference-date="referenceDateValue"
          :time-zones="supportedTimeZoneValues"
          @update:model-value="updateWindowTimeZone"
        />
        <div class="two-col">
          <div class="field">
            <label :for="windowStartId">Start</label>
            <input
              :id="windowStartId"
              :value="windowStartValue"
              type="time"
              @input="updateWindowStart"
            />
          </div>
          <div class="field">
            <label :for="windowEndId">End</label>
            <input :id="windowEndId" :value="windowEndValue" type="time" @input="updateWindowEnd" />
          </div>
        </div>
        <p v-if="windowDraftErrorLabel.length > 0" class="form-error">
          {{ windowDraftErrorLabel }}
        </p>
        <button class="button secondary full" type="button" @click="addWorkWindow">
          Add window
        </button>
      </form>

      <button class="text-button" type="button" @click="removeSelectedMember">
        Remove {{ selectedMemberName }}
      </button>
    </template>
    <p v-else class="empty-note">No member selected.</p>
  </section>
</template>

<style scoped>
.panel {
  border: 0;
  border-radius: var(--radius);
  padding: 0;
  background: transparent;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.section-title {
  margin: 0;
  font-size: var(--font-size-heading);
  font-weight: 750;
  letter-spacing: 0;
  text-transform: uppercase;
}

.section-subtitle,
.home-zone-label,
.window-range,
.window-zone {
  color: var(--color-muted);
  font-size: var(--font-size-xl);
}

.home-zone,
.window-item {
  border: 0;
  border-top: 1px solid var(--color-border);
  border-radius: 0;
  padding: 11px 0;
  background: transparent;
}

.home-zone {
  display: grid;
  grid-template-columns: 12px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
}

.member-dot {
  width: 10px;
  height: 10px;
  border-radius: 0;
  background: var(--member-color);
}

.home-zone-label,
.window-range,
.window-zone {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.window-list,
.stack-form {
  display: grid;
  gap: 10px;
}

.window-list {
  margin-top: 12px;
}

.window-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-inline-start: 10px;
  border-inline-start: 3px solid var(--member-color);
}

.compact {
  margin-top: 16px;
}

.two-col {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 120px), 1fr));
  gap: 10px;
}

.button {
  min-height: 36px;
  border: 1px solid var(--color-border-strong);
  border-radius: 0;
  padding: 7px 12px;
  font-weight: 750;
}

.button.secondary {
  color: var(--color-ink);
  border-color: var(--color-border-strong);
  background: transparent;
}

.button.full {
  width: 100%;
}

.text-button {
  width: 100%;
  min-height: 34px;
  margin-top: 12px;
  border: 1px solid var(--color-border);
  border-radius: 0;
  color: var(--color-danger);
  background: transparent;
  font-weight: 700;
}

.icon-button {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--color-border);
  border-radius: 0;
  color: var(--color-muted);
  background: transparent;
  font-weight: 700;
}

.icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.form-error {
  margin: 0;
  color: var(--color-danger);
  font-size: var(--font-size-form);
}

.empty-note {
  margin: 0;
  border: 1px solid var(--color-border);
  border-radius: 0;
  padding: 8px 10px;
  color: var(--color-muted);
  background: transparent;
  font-size: var(--font-size-form);
}
</style>
