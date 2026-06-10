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

<style scoped src="./WorkWindowPanel.css"></style>
