<script setup lang="ts">
import { computed } from "vue";
import type { MemberTimeline } from "../../availability/coretimeTypes";
import { formatMinuteRange } from "../../availability/timeMath";
import { formatTimeZoneLabel } from "../../availability/timeZoneMath";
import TimelineRow from "./TimelineRow.vue";
import { useCoretimeContext } from "../workbench/coretimeContext";

const {
  candidateIntervals,
  coverageSlots,
  hourMarks,
  memberTimelines,
  referenceDate,
  referenceTimeZone,
} = useCoretimeContext();

const candidateIndexes = computed<readonly number[]>(() =>
  candidateIntervals.value.map((_, index) => index),
);
const coverageIndexes = computed<readonly number[]>(() =>
  coverageSlots.value.map((_, index) => index),
);
const hourIndexes = computed<readonly number[]>(() => hourMarks.value.map((_, index) => index));
const hourLabels = computed<readonly string[]>(() => hourMarks.value.map((hour) => hour.label));
const referenceLabel = computed<string>(
  () =>
    `${referenceDate.value} / ${formatTimeZoneLabel(readReferenceTimeZone(), readReferenceDate())}`,
);
const timelineRowIndexes = computed<readonly number[]>(() =>
  memberTimelines.value.map((_, index) => index),
);

function candidateIdAt(index: number): string {
  const candidate = candidateIntervals.value[index];

  return candidate === undefined
    ? String(index)
    : `${candidate.startMinute}-${candidate.endMinute}-${candidate.count}`;
}

function candidateStartAt(index: number): number {
  return candidateIntervals.value[index]?.startMinute ?? 0;
}

function candidateTitleAt(index: number): string {
  const candidate = candidateIntervals.value[index];
  if (candidate === undefined) {
    return "";
  }

  return `${formatMinuteRange(candidate.startMinute, candidate.endMinute)} / ${candidate.count}`;
}

function candidateWidthAt(index: number): number {
  const candidate = candidateIntervals.value[index];

  return candidate === undefined ? 0 : candidate.endMinute - candidate.startMinute;
}

function coverageLevelAt(index: number): number {
  return coverageSlots.value[index]?.level ?? 0;
}

function coverageStartAt(index: number): number {
  return coverageSlots.value[index]?.startMinute ?? 0;
}

function coverageTitleAt(index: number): string {
  const slot = coverageSlots.value[index];
  if (slot === undefined) {
    return "";
  }

  return `${formatMinuteRange(slot.startMinute, slot.endMinute)}: ${slot.count}`;
}

function hourLabelAt(index: number): string {
  return hourLabels.value[index] ?? "";
}

function readReferenceDate(): string {
  return referenceDate.value;
}

function readReferenceTimeZone(): string {
  return referenceTimeZone.value;
}

function timelineRowAt(index: number): MemberTimeline {
  const row = memberTimelines.value[index];
  if (row === undefined) {
    throw new Error(`Missing timeline row at ${index}.`);
  }

  return row;
}

function timelineRowKeyAt(index: number): string {
  return timelineRowAt(index).member.id;
}
</script>

<template>
  <!-- @vize:docs Reference-day timeline for availability overlap. Weekend markers are calculated from each member's local calendar date, while public holidays are intentionally omitted because holiday inference would be heuristic and country-specific. -->
  <section class="timeline-panel">
    <div class="timeline-header">
      <div>
        <p class="timeline-title">Reference day</p>
        <strong class="timeline-date">{{ referenceLabel }}</strong>
      </div>
      <span class="timeline-note">
        30 minute resolution. Weekend markers use local dates; public holidays are excluded because
        they would be heuristic.
      </span>
    </div>

    <div class="timeline">
      <div class="hour-scale" aria-hidden="true">
        <span v-for="index in hourIndexes" :key="hourLabelAt(index)">{{ hourLabelAt(index) }}</span>
      </div>

      <div class="coverage-row" aria-label="Coverage heatmap">
        <span class="row-label">Coverage</span>
        <div class="coverage-track">
          <span
            v-for="index in coverageIndexes"
            :key="coverageStartAt(index)"
            class="coverage-cell"
            :data-level="coverageLevelAt(index)"
            :title="coverageTitleAt(index)"
          ></span>
        </div>
      </div>

      <TimelineRow
        v-for="index in timelineRowIndexes"
        :key="timelineRowKeyAt(index)"
        :row="timelineRowAt(index)"
      />

      <div class="candidate-bars" aria-label="Candidate intervals">
        <span class="row-label">Candidates</span>
        <svg class="candidate-track" viewBox="0 0 1440 1" preserveAspectRatio="none">
          <rect
            v-for="index in candidateIndexes"
            :key="candidateIdAt(index)"
            class="candidate-bar"
            :x="candidateStartAt(index)"
            y="0"
            :width="candidateWidthAt(index)"
            height="1"
          >
            <title>{{ candidateTitleAt(index) }}</title>
          </rect>
        </svg>
      </div>
    </div>
  </section>
</template>

<style scoped>
.timeline-panel {
  overflow: hidden;
  border: 0;
  border-top: 1px solid var(--color-border-strong);
  border-bottom: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: transparent;
}

.timeline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--color-border);
  padding: 18px 0;
}

.timeline-title,
.timeline-date {
  margin: 0;
}

.timeline-title {
  color: var(--color-muted);
  font-size: var(--font-size-md);
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.timeline-note {
  color: var(--color-muted);
  font-size: var(--font-size-xl);
}

.timeline {
  overflow-x: auto;
  padding: 16px 0 20px;
}

.hour-scale,
.coverage-row,
.candidate-bars {
  display: grid;
  grid-template-columns: var(--timeline-label) minmax(640px, 1fr);
  gap: 14px;
  min-width: 0;
}

.hour-scale {
  grid-template-columns: calc(var(--timeline-label) + 14px) repeat(24, 1fr) 0;
  align-items: end;
  column-gap: 0;
  margin-bottom: 8px;
  color: var(--color-muted);
  font-size: var(--font-size-xs);
}

.hour-scale::before {
  content: "";
}

.row-label {
  min-width: 0;
  color: var(--color-muted);
  font-size: var(--font-size-lg);
}

.coverage-row,
.candidate-bars {
  align-items: center;
  border-top: 1px solid var(--color-border);
  padding: 12px 0;
}

.coverage-track {
  display: grid;
  grid-template-columns: repeat(48, minmax(0, 1fr));
  gap: 1px;
  min-height: 22px;
}

.coverage-cell {
  min-width: 0;
  border-radius: 0;
  background: var(--color-coverage-0);
}

.coverage-cell[data-level="1"] {
  background: var(--color-coverage-1);
}

.coverage-cell[data-level="2"] {
  background: var(--color-coverage-2);
}

.coverage-cell[data-level="3"] {
  background: var(--color-coverage-3);
}

.coverage-cell[data-level="4"] {
  background: var(--color-coverage-4);
}

.candidate-track {
  display: block;
  width: 100%;
  height: 30px;
  min-height: 30px;
  border: 1px solid var(--color-border);
  border-radius: 0;
  overflow: hidden;
  background: var(--color-surface);
}

.candidate-bar {
  fill: var(--color-candidate);
}
</style>
