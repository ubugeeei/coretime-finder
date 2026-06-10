<script setup lang="ts">
import { computed } from "vue";
import { mdiMapMarker } from "@mdi/js";
import type { TimeZonePickerOption } from "./timeZonePicker";
import { JAPAN_LAND_PATHS, WORLD_LAND_PATHS } from "./worldMapPaths";

const { modelValue, options } = defineProps<{
  modelValue: string;
  options: readonly TimeZonePickerOption[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const optionIndexes = computed<readonly number[]>(() => options.map((_, index) => index));
const japanLandIndexes = computed<readonly number[]>(() =>
  JAPAN_LAND_PATHS.map((_, index) => index),
);
const selectedOption = computed<TimeZonePickerOption | undefined>(() =>
  options.find((option) => option.timeZone === modelValue),
);
const selectedLocationLabel = computed<string>(() =>
  selectedOption.value === undefined
    ? "Selected"
    : `${selectedOption.value.city}, ${selectedOption.value.region}`,
);
const selectedOffsetLabel = computed<string>(() => selectedOption.value?.offset ?? "");
const selectedTimeZoneLabel = computed<string>(() => selectedOption.value?.timeZone ?? modelValue);
const worldLandIndexes = computed<readonly number[]>(() =>
  WORLD_LAND_PATHS.map((_, index) => index),
);

function selectTimeZone(timeZone: string): void {
  emit("update:modelValue", timeZone);
}

function selectSelected(): void {
  const selected = selectedOption.value ?? options[0];
  if (selected !== undefined) {
    selectTimeZone(selected.timeZone);
  }
}

function selectNearestFromMap(event: MouseEvent): void {
  const target = event.currentTarget;
  if (!(target instanceof Element)) {
    return;
  }

  const rect = target.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  const nearest = nearestMapOption(x, y);
  if (nearest !== undefined) {
    selectTimeZone(nearest.timeZone);
  }
}

function nearestMapOption(x: number, y: number): TimeZonePickerOption | undefined {
  let nearest: TimeZonePickerOption | undefined;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const option of options) {
    const distance = Math.hypot(option.x - x, (option.y - y) * 1.35);
    if (distance < nearestDistance) {
      nearest = option;
      nearestDistance = distance;
    }
  }

  return nearest;
}

function markerAriaLabelAt(index: number): string {
  const option = optionAt(index);

  return `${option.city}, ${option.region}`;
}

function japanLandKeyAt(index: number): string {
  return `japan-${japanLandPathAt(index)}`;
}

function japanLandPathAt(index: number): string {
  return JAPAN_LAND_PATHS[index] ?? "";
}

function markerClassAt(index: number): Record<string, boolean> {
  return { selected: optionAt(index).timeZone === modelValue };
}

function markerKeyAt(index: number): string {
  return optionAt(index).timeZone;
}

function markerTitleAt(index: number): string {
  const option = optionAt(index);

  return `${option.city}, ${option.region} / ${option.timeZone}`;
}

function markerTransformAt(index: number): string {
  const option = optionAt(index);

  return `translate(${option.x} ${option.y})`;
}

function optionAt(index: number): TimeZonePickerOption {
  const option = options[index];
  if (option === undefined) {
    throw new Error(`Missing map option at ${index}.`);
  }

  return option;
}

function selectTimeZoneAt(index: number): void {
  selectTimeZone(optionAt(index).timeZone);
}

function worldLandPathAt(index: number): string {
  return WORLD_LAND_PATHS[index] ?? "";
}
</script>

<template>
  <section class="map-panel" aria-label="World map time zone picker">
    <svg
      class="world-map"
      role="button"
      tabindex="0"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      @click="selectNearestFromMap"
      @keydown.enter.prevent="selectSelected"
      @keydown.space.prevent="selectSelected"
    >
      <line class="prime-meridian" x1="50" x2="50" y1="5" y2="95" />
      <line class="equator" x1="3" x2="97" y1="50" y2="50" />
      <path
        v-for="index in worldLandIndexes"
        :key="worldLandPathAt(index)"
        class="world-land"
        :d="worldLandPathAt(index)"
      />
      <path
        v-for="index in japanLandIndexes"
        :key="japanLandKeyAt(index)"
        class="japan-land"
        :d="japanLandPathAt(index)"
      />
      <g
        v-for="index in optionIndexes"
        :key="markerKeyAt(index)"
        class="map-marker"
        :class="markerClassAt(index)"
        role="button"
        tabindex="0"
        :aria-label="markerAriaLabelAt(index)"
        :transform="markerTransformAt(index)"
        @click.stop="selectTimeZoneAt(index)"
        @keydown.enter.prevent.stop="selectTimeZoneAt(index)"
        @keydown.space.prevent.stop="selectTimeZoneAt(index)"
      >
        <title>{{ markerTitleAt(index) }}</title>
        <path class="map-pin" :d="mdiMapMarker" transform="translate(-1.45 -2.9) scale(0.12)" />
      </g>
    </svg>
    <div class="map-readout">
      <span class="map-readout-location">{{ selectedLocationLabel }}</span>
      <strong class="map-readout-zone">{{ selectedTimeZoneLabel }}</strong>
      <small class="map-readout-offset">{{ selectedOffsetLabel }}</small>
    </div>
  </section>
</template>

<style scoped>
.map-panel {
  display: grid;
  gap: 10px;
}

.world-map {
  display: block;
  width: 100%;
  min-height: 330px;
  border: 1px solid var(--color-border);
  background: linear-gradient(180deg, rgb(255 255 255 / 3%), transparent 42%), var(--color-surface);
  overflow: hidden;
}

.world-land {
  stroke: var(--color-border-strong);
  stroke-width: 0.35;
  fill: var(--color-surface-strong);
  fill-rule: evenodd;
  vector-effect: non-scaling-stroke;
}

.prime-meridian,
.equator {
  stroke: #f2f2ec;
  stroke-dasharray: 1.4 1.4;
  stroke-width: 0.38;
  opacity: 0.58;
  vector-effect: non-scaling-stroke;
}

.japan-land {
  stroke: #f2f2ec;
  stroke-width: 0.46;
  fill: #1e3733;
  opacity: 1;
}

.map-marker {
  color: var(--color-muted);
  cursor: pointer;
}

.map-marker.selected {
  color: var(--color-candidate);
}

.map-pin {
  fill: currentColor;
}

.map-readout {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2px 12px;
  border-block-start: 1px solid var(--color-border);
  padding-block-start: 10px;
}

.map-readout-location,
.map-readout-offset {
  color: var(--color-muted);
  font-size: var(--font-size-md);
}

.map-readout-zone {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
