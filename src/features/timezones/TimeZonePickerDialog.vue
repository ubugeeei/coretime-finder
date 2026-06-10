<script setup lang="ts">
import { computed, ref } from "vue";
import { mdiClose, mdiMagnify } from "@mdi/js";
import {
  buildTimeZonePickerOptions,
  filterTimeZonePickerOptions,
  mapTimeZonePickerOptions,
} from "./timeZonePicker";
import type { TimeZonePickerOption } from "./timeZonePicker";
import TimeZoneWorldMap from "./TimeZoneWorldMap.vue";

const { id, modelValue, referenceDate, timeZones } = defineProps<{
  id: string;
  modelValue: string;
  referenceDate: string;
  timeZones: readonly string[];
}>();

const emit = defineEmits<{
  close: [];
  "update:modelValue": [value: string];
}>();

const query = ref("");
const mapOptions = computed<readonly TimeZonePickerOption[]>(() =>
  mapTimeZonePickerOptions(readOptions()),
);
const options = computed<readonly TimeZonePickerOption[]>(() =>
  buildTimeZonePickerOptions(readTimeZones(), readReferenceDate()),
);
const resultIndexes = computed<readonly number[]>(() => results.value.map((_, index) => index));
const results = computed<readonly TimeZonePickerOption[]>(() =>
  filterTimeZonePickerOptions(readOptions(), readQuery()),
);
const searchId = computed<string>(() => `${id}-search`);
const selectedOption = computed<TimeZonePickerOption | undefined>(() =>
  readOptions().find((option) => option.timeZone === readModelValue()),
);
const selectedTitle = computed<string>(() => selectedOption.value?.label ?? modelValue);
const titleId = computed<string>(() => `${id}-title`);

function selectTimeZone(timeZone: string): void {
  emit("update:modelValue", timeZone);
}

function readModelValue(): string {
  return modelValue;
}

function readOptions(): readonly TimeZonePickerOption[] {
  return options.value;
}

function readQuery(): string {
  return query.value;
}

function readReferenceDate(): string {
  return referenceDate;
}

function readTimeZones(): readonly string[] {
  return timeZones;
}

function resultCityAt(index: number): string {
  return resultAt(index).city;
}

function resultIdAt(index: number): string {
  return resultAt(index).timeZone;
}

function resultIsSelectedAt(index: number): boolean {
  return resultAt(index).timeZone === modelValue;
}

function resultMetaAt(index: number): string {
  const result = resultAt(index);

  return `${result.timeZone} / ${result.offset}`;
}

function resultRegionAt(index: number): string {
  return resultAt(index).region;
}

function resultAt(index: number): TimeZonePickerOption {
  const result = results.value[index];
  if (result === undefined) {
    throw new Error(`Missing time zone result at ${index}.`);
  }

  return result;
}

function selectResult(index: number): void {
  selectTimeZone(resultAt(index).timeZone);
}
</script>

<template>
  <div class="dialog-backdrop">
    <section class="timezone-dialog" role="dialog" aria-modal="true" :aria-labelledby="titleId">
      <header class="dialog-header">
        <div>
          <p class="dialog-eyebrow">Time zone</p>
          <h2 :id="titleId" class="dialog-title">{{ selectedTitle }}</h2>
        </div>
        <button class="icon-button" type="button" aria-label="Close" @click="emit('close')">
          <svg class="close-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path :d="mdiClose" />
          </svg>
        </button>
      </header>

      <div class="search-field">
        <label class="search-label" :for="searchId">Search</label>
        <div class="search-control">
          <svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path :d="mdiMagnify" />
          </svg>
          <input
            v-model="query"
            class="search-input"
            :id="searchId"
            placeholder="Country, city, or time zone"
          />
        </div>
      </div>

      <div class="picker-layout">
        <section class="result-list" aria-label="Time zone results">
          <button
            v-for="index in resultIndexes"
            :key="resultIdAt(index)"
            class="result-item"
            :class="{ selected: resultIsSelectedAt(index) }"
            type="button"
            @click="selectResult(index)"
          >
            <strong class="result-city">{{ resultCityAt(index) }}</strong>
            <span class="result-region">{{ resultRegionAt(index) }}</span>
            <small class="result-meta">{{ resultMetaAt(index) }}</small>
          </button>
          <p v-if="results.length === 0" class="empty-result">No matching zones</p>
        </section>

        <TimeZoneWorldMap :model-value :options="mapOptions" @update:model-value="selectTimeZone" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.dialog-backdrop {
  position: fixed;
  z-index: var(--z-dialog);
  inset: 0;
  display: grid;
  place-items: center;
  padding: 22px;
  background: rgb(0 0 0 / 74%);
}

.timezone-dialog {
  width: min(980px, 100%);
  max-height: min(760px, calc(100vh - 44px));
  border: 1px solid var(--color-border-strong);
  padding: 18px;
  background: var(--color-bg);
  overflow: auto;
}

.dialog-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 16px;
  border-block-end: 1px solid var(--color-border);
  padding-block-end: 14px;
}

.dialog-eyebrow,
.dialog-title {
  margin: 0;
}

.dialog-eyebrow,
.search-label {
  color: var(--color-muted);
  font-size: var(--font-size-md);
}

.dialog-title {
  margin-block-start: 2px;
  font-size: var(--font-size-dialog-title);
}

.icon-button {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--color-border-strong);
  color: var(--color-ink);
  background: transparent;
}

.close-icon,
.search-icon {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.search-field {
  margin-block-start: 14px;
}

.search-control {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  border: 1px solid var(--color-border);
  padding: 0 9px;
  background: var(--color-surface);
}

.search-input {
  border: 0;
  padding-inline: 0;
}

.picker-layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 360px), 1fr));
  gap: 16px;
  margin-block-start: 16px;
}

.result-list {
  max-height: 470px;
  border-block-start: 1px solid var(--color-border);
  overflow: auto;
}

.result-item {
  display: grid;
  gap: 2px;
  width: 100%;
  border: 0;
  border-block-end: 1px solid var(--color-border);
  padding: 10px 0;
  color: var(--color-ink);
  text-align: left;
  background: transparent;
}

.result-item.selected,
.result-item:hover {
  padding-inline: 10px;
  background: var(--color-surface-strong);
}

.result-region,
.result-meta,
.empty-result {
  color: var(--color-muted);
  font-size: var(--font-size-sm);
}

.result-city {
  font-size: var(--font-size-row-title);
}

.empty-result {
  margin: 0;
  padding: 12px 0;
}
</style>
