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

<style scoped src="./TimelineRow.css"></style>
