<script setup lang="ts">
import { computed } from "vue";
import type { DayPhase, DayPhaseSegment, MemberTimeline } from "../../availability/coretimeTypes";
import { DAY_PHASE_LABELS } from "../../availability/coretimeTypes";
import { formatMinuteRange } from "../../availability/timeMath";
import {
  mdiWeatherNight,
  mdiWeatherNightPartlyCloudy,
  mdiWeatherSunny,
  mdiWeatherSunsetDown,
  mdiWeatherSunsetUp,
} from "./mdiWeatherPaths";

const { row } = defineProps<{
  row: MemberTimeline;
}>();

const phaseIcons: Record<DayPhase, string> = {
  day: mdiWeatherSunny,
  "deep-night": mdiWeatherNight,
  evening: mdiWeatherSunsetDown,
  morning: mdiWeatherSunsetUp,
  night: mdiWeatherNightPartlyCloudy,
};

const memberColor = computed(() => row.member.color);
const memberName = computed<string>(() => row.member.name);
const memberRegionLabel = computed<string>(() => row.member.region || "No region");
const phaseIcon = computed<string>(() => phaseIcons[row.phaseSnapshot.phase]);
const phaseIndexes = computed<readonly number[]>(() => row.phaseSegments.map((_, index) => index));
const phaseLabel = computed<string>(() => DAY_PHASE_LABELS[row.phaseSnapshot.phase]);
const phaseName = computed<DayPhase>(() => row.phaseSnapshot.phase);
const phaseTimeLabel = computed<string>(() => `Now ${row.phaseSnapshot.localTime}`);
const snapshotDayOffsetLabel = computed<string>(() => dayOffsetLabel(snapshotDayOffset()));
const snapshotDateLabel = computed<string>(
  () => `${row.phaseSnapshot.localDay} ${row.phaseSnapshot.localDate}`,
);
const snapshotIsWeekend = computed<boolean>(() => row.phaseSnapshot.isWeekend);
const weekendIndexes = computed<readonly number[]>(() =>
  row.phaseSegments.flatMap((segment, index) => (segment.isWeekend ? [index] : [])),
);
const workSegmentIndexes = computed<readonly number[]>(() => row.segments.map((_, index) => index));

function dayOffsetLabel(dayOffset: number): string {
  if (dayOffset === 0) {
    return "same day";
  }

  return dayOffset > 0 ? `+${dayOffset}d` : `${dayOffset}d`;
}

function isWeekendSegment(segment: DayPhaseSegment): boolean {
  return segment.isWeekend;
}

function phaseAt(index: number): DayPhase {
  return phaseSegmentAt(index).phase;
}

function snapshotDayOffset(): number {
  return row.phaseSnapshot.dayOffset;
}

function phaseClassesAt(index: number): string[] {
  const segment = phaseSegmentAt(index);

  return [
    "phase-segment",
    slotStartClass(segment.startMinute),
    slotSpanClass(segment.durationMinutes),
    segment.isWeekend ? "weekend-phase" : "",
  ].filter(Boolean);
}

function phaseKeyAt(index: number): string {
  const segment = phaseSegmentAt(index);

  return `${segment.startMinute}-${segment.endMinute}-${segment.phase}`;
}

function phaseSegmentAt(index: number): DayPhaseSegment {
  const segment = row.phaseSegments[index];
  if (segment === undefined) {
    throw new Error(`Missing phase segment at ${index}.`);
  }

  return segment;
}

function phaseTitleAt(index: number): string {
  const segment = phaseSegmentAt(index);
  const weekend = segment.isWeekend ? " / Weekend" : "";

  return `${DAY_PHASE_LABELS[segment.phase]} / ${formatMinuteRange(
    segment.startMinute,
    segment.endMinute,
  )} / ${segment.localDay} ${segment.localDate} ${dayOffsetLabel(segment.dayOffset)}${weekend}`;
}

function slotSpanClass(durationMinutes: number): string {
  return `slot-span-${Math.max(1, Math.ceil(durationMinutes / 30))}`;
}

function slotStartClass(startMinute: number): string {
  return `slot-start-${Math.floor(startMinute / 30)}`;
}

function weekendClassesAt(index: number): string[] {
  const segment = phaseSegmentAt(index);

  return [
    "weekend-segment",
    slotStartClass(segment.startMinute),
    slotSpanClass(segment.durationMinutes),
  ];
}

function weekendKeyAt(index: number): string {
  const segment = phaseSegmentAt(index);

  return `weekend-${segment.startMinute}-${segment.endMinute}-${segment.localDate}`;
}

function weekendLabelAt(index: number): string {
  const segment = phaseSegmentAt(index);

  return segment.durationMinutes >= 120 ? segment.localDay : "";
}

function weekendTitleAt(index: number): string {
  const segment = phaseSegmentAt(index);

  return `${segment.localDay} ${segment.localDate} ${dayOffsetLabel(segment.dayOffset)} / Weekend`;
}

function workClassesAt(index: number): string[] {
  const segment = workSegmentAt(index);

  return [
    "work-segment",
    slotStartClass(segment.startMinute),
    slotSpanClass(segment.durationMinutes),
  ];
}

function workKeyAt(index: number): string {
  const segment = workSegmentAt(index);

  return `${segment.startMinute}-${segment.endMinute}`;
}

function workLabelAt(index: number): string {
  const segment = workSegmentAt(index);

  return segment.durationMinutes >= 120
    ? formatMinuteRange(segment.startMinute, segment.endMinute)
    : "";
}

function workSegmentAt(index: number) {
  const segment = row.segments[index];
  if (segment === undefined) {
    throw new Error(`Missing work segment at ${index}.`);
  }

  return segment;
}

function workTitleAt(index: number): string {
  const segment = workSegmentAt(index);

  return formatMinuteRange(segment.startMinute, segment.endMinute);
}
</script>

<template>
  <div class="timeline-row" :data-color="memberColor">
    <div class="row-label">
      <strong class="row-name">{{ memberName }}</strong>
      <span class="row-region">{{ memberRegionLabel }}</span>
      <span class="date-line" :class="{ weekend: snapshotIsWeekend }">
        {{ snapshotDateLabel }}
        <em class="day-offset">{{ snapshotDayOffsetLabel }}</em>
        <em v-if="snapshotIsWeekend" class="weekend-label">Weekend</em>
      </span>
      <span class="phase-pill" :data-phase="phaseName">
        <svg class="phase-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path :d="phaseIcon" />
        </svg>
        <span class="phase-label">{{ phaseLabel }}</span>
        <small class="phase-time">{{ phaseTimeLabel }}</small>
      </span>
    </div>
    <div class="track">
      <span
        v-for="index in phaseIndexes"
        :key="phaseKeyAt(index)"
        :class="phaseClassesAt(index)"
        :data-phase="phaseAt(index)"
        :title="phaseTitleAt(index)"
      >
        {{ "" }}
      </span>
      <span
        v-for="index in weekendIndexes"
        :key="weekendKeyAt(index)"
        :class="weekendClassesAt(index)"
        :title="weekendTitleAt(index)"
      >
        <span v-if="weekendLabelAt(index).length > 0">{{ weekendLabelAt(index) }}</span>
      </span>
      <span
        v-for="index in workSegmentIndexes"
        :key="workKeyAt(index)"
        :class="workClassesAt(index)"
        :title="workTitleAt(index)"
      >
        <span v-if="workLabelAt(index).length > 0" class="work-label">
          {{ workLabelAt(index) }}
        </span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.timeline-row {
  display: grid;
  grid-template-columns: var(--timeline-label) minmax(640px, 1fr);
  align-items: center;
  gap: 14px;
  min-width: 0;
  border-top: 1px solid var(--color-border);
  padding: 12px 0;
}

.row-label {
  min-width: 0;
  color: var(--color-muted);
  font-size: var(--font-size-lg);
}

.row-name,
.row-region,
.date-line {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-name {
  color: var(--color-ink);
  font-size: var(--font-size-row-title);
}

.date-line {
  margin-top: 3px;
}

.day-offset,
.weekend-label {
  display: inline-block;
  margin-inline-start: 5px;
  color: var(--color-muted);
  font-style: normal;
}

.date-line.weekend {
  color: var(--color-weekend);
}

.weekend-label {
  color: var(--color-weekend);
}

.phase-pill {
  display: inline-grid;
  grid-template-columns: 16px auto auto;
  align-items: center;
  column-gap: 6px;
  width: fit-content;
  max-width: 100%;
  margin-top: 5px;
  border: 1px solid var(--phase-border);
  border-radius: 0;
  padding: 4px 7px 4px 5px;
  color: var(--phase-ink);
  background: var(--phase-pill-bg);
}

.phase-label,
.phase-time {
  display: block;
  overflow: visible;
  color: inherit;
  font-size: var(--font-size-2xs);
  font-weight: 750;
  line-height: 1;
  white-space: nowrap;
}

.phase-icon {
  display: block;
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
  fill: currentColor;
}

.track {
  position: relative;
  display: grid;
  grid-template-columns: repeat(48, minmax(0, 1fr));
  grid-template-rows: 4px 10px minmax(0, 1fr) 10px 4px;
  min-height: 56px;
  border: 1px solid var(--color-border);
  border-radius: 0;
  overflow: hidden;
  background: var(--color-surface);
}

.phase-segment,
.weekend-segment,
.work-segment {
  grid-column: var(--slot-start) / span var(--slot-span);
  min-width: 4px;
}

.phase-segment {
  grid-row: 1 / -1;
  border-inline-end: 1px solid rgb(255 255 255 / 36%);
  background: var(--phase-bg);
}

.phase-segment.weekend-phase {
  border-top: 2px solid var(--color-weekend);
}

.weekend-segment {
  z-index: var(--z-member-drop);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 12px;
  border-bottom: 1px solid var(--color-weekend);
  color: var(--color-weekend);
  font-size: var(--font-size-3xs);
  font-weight: 800;
  line-height: 1;
  pointer-events: none;
}

.work-segment {
  grid-row: 2 / 5;
  display: flex;
  align-items: center;
  overflow: hidden;
  border: 1px solid var(--member-color);
  border-radius: 0;
  padding: 0 8px;
  color: var(--color-ink);
  background: var(--member-soft);
}

.work-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--font-size-sm);
  font-weight: 750;
}

[data-phase="morning"] {
  --phase-bg: #1f3d4a;
  --phase-border: #4fb2d2;
  --phase-ink: #bdefff;
  --phase-pill-bg: #142a33;
}

[data-phase="day"] {
  --phase-bg: #4a3911;
  --phase-border: #d7aa2e;
  --phase-ink: #ffe9a3;
  --phase-pill-bg: #2a210c;
}

[data-phase="evening"] {
  --phase-bg: #4a2418;
  --phase-border: #ef8a58;
  --phase-ink: #ffd4bd;
  --phase-pill-bg: #2d1710;
}

[data-phase="night"] {
  --phase-bg: #1b2543;
  --phase-border: #6f85d8;
  --phase-ink: #d6ddff;
  --phase-pill-bg: #12192d;
}

[data-phase="deep-night"] {
  --phase-bg: #0d1019;
  --phase-border: #39435f;
  --phase-ink: #aeb9d8;
  --phase-pill-bg: #090c14;
}
</style>
