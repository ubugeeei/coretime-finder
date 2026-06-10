<script setup lang="ts">
import { computed } from "vue";
import type { CandidateInterval } from "../../availability/coretimeTypes";
import type { Member } from "../../availability/coretimeTypes";
import { formatDuration, formatMinuteRange } from "../../availability/timeMath";
import { formatTimeZoneLabel } from "../../availability/timeZoneMath";
import { memberNamesForIds } from "../../availability/coretimeModel";
import TimelineView from "../timeline/TimelineView.vue";
import { useCoretimeContext } from "../workbench/coretimeContext";

type CandidateSummary = {
  id: string;
  countLabel: string;
  durationLabel: string;
  memberLabel: string;
  rangeLabel: string;
};

const {
  candidateIntervals,
  featuredCandidate,
  maxCoverage,
  members,
  minParticipants,
  referenceDate,
  referenceTimeZone,
  totalCandidateMinutes,
} = useCoretimeContext();

const bestWindowLabel = computed<string>(() =>
  featuredCandidate.value === undefined
    ? "None"
    : formatMinuteRange(featuredCandidate.value.startMinute, featuredCandidate.value.endMinute),
);
const bestDurationLabel = computed<string>(() =>
  featuredCandidate.value === undefined
    ? "0m"
    : formatDuration(featuredCandidate.value.durationMinutes),
);
const candidateCountLabel = computed<string>(() => `${candidateIntervals.value.length} windows`);
const candidateIndexes = computed<readonly number[]>(() =>
  candidateSummaries.value.map((_, index) => index),
);
const candidateSummaries = computed<readonly CandidateSummary[]>(() =>
  candidateIntervals.value.slice(0, 6).map((candidate) => ({
    countLabel: `${candidate.count} people`,
    durationLabel: formatDuration(candidate.durationMinutes),
    id: `${candidate.startMinute}-${candidate.endMinute}-${candidate.count}`,
    memberLabel: memberNames(candidate),
    rangeLabel: formatMinuteRange(candidate.startMinute, candidate.endMinute),
  })),
);
const hasCandidates = computed<boolean>(() => candidateIntervals.value.length > 0);
const peakCoverageLabel = computed<string>(() => `${maxCoverage.value} / ${members.value.length}`);
const referenceZoneLabel = computed<string>(() =>
  formatTimeZoneLabel(readReferenceTimeZone(), readReferenceDate()),
);
const requiredParticipantsLabel = computed<string>(() => `${minParticipants.value} required`);
const totalCandidateLabel = computed<string>(
  () => `${formatDuration(totalCandidateMinutes.value)} total`,
);

function memberNames(candidate: CandidateInterval): string {
  return memberNamesForIds(readMembers(), candidate.activeMemberIds).join(", ");
}

function candidateCountAt(index: number): string {
  return candidateSummaries.value[index]?.countLabel ?? "";
}

function candidateDurationAt(index: number): string {
  return candidateSummaries.value[index]?.durationLabel ?? "";
}

function candidateIdAt(index: number): string {
  return candidateSummaries.value[index]?.id ?? String(index);
}

function candidateMembersAt(index: number): string {
  return candidateSummaries.value[index]?.memberLabel ?? "";
}

function candidateRangeAt(index: number): string {
  return candidateSummaries.value[index]?.rangeLabel ?? "";
}

function readMembers(): readonly Member[] {
  return members.value;
}

function readReferenceDate(): string {
  return referenceDate.value;
}

function readReferenceTimeZone(): string {
  return referenceTimeZone.value;
}
</script>

<template>
  <section class="visual-column" aria-label="Core Time visualization">
    <div class="summary-band">
      <div class="summary-item">
        <span class="summary-eyebrow">Best window</span>
        <strong class="summary-value">{{ bestWindowLabel }}</strong>
        <small class="summary-note">{{ referenceZoneLabel }}</small>
      </div>
      <div class="summary-item">
        <span class="summary-eyebrow">Duration</span>
        <strong class="summary-value">{{ bestDurationLabel }}</strong>
        <small class="summary-note">{{ totalCandidateLabel }}</small>
      </div>
      <div class="summary-item">
        <span class="summary-eyebrow">Peak coverage</span>
        <strong class="summary-value">{{ peakCoverageLabel }}</strong>
        <small class="summary-note">{{ requiredParticipantsLabel }}</small>
      </div>
    </div>

    <div class="candidate-panel">
      <div class="section-heading">
        <p class="section-title">Core Time candidates</p>
        <span class="section-count">{{ candidateCountLabel }}</span>
      </div>
      <div v-if="hasCandidates" class="candidate-list">
        <div v-for="index in candidateIndexes" :key="candidateIdAt(index)" class="candidate-item">
          <div class="candidate-main">
            <strong class="candidate-range">{{ candidateRangeAt(index) }}</strong>
            <span class="candidate-duration">{{ candidateDurationAt(index) }}</span>
          </div>
          <div class="candidate-meta">
            <span class="candidate-count">{{ candidateCountAt(index) }}</span>
            <small class="candidate-members">{{ candidateMembersAt(index) }}</small>
          </div>
        </div>
      </div>
      <p v-else class="empty-note">No overlap at the selected threshold.</p>
    </div>

    <TimelineView />
  </section>
</template>

<style scoped>
.visual-column {
  display: grid;
  align-content: start;
  gap: 22px;
  min-width: 0;
}

.summary-band,
.candidate-panel {
  border: 0;
  border-radius: var(--radius);
  background: transparent;
}

.summary-band {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
  border-top: 1px solid var(--color-border-strong);
  border-bottom: 1px solid var(--color-border);
  overflow: hidden;
}

.summary-item {
  display: grid;
  gap: 4px;
  min-width: 0;
  padding: 18px 20px;
  border-inline-end: 1px solid var(--color-border);
}

.summary-item:first-child {
  padding-inline-start: 0;
}

.summary-item:last-child {
  border-inline-end: 0;
}

.summary-eyebrow,
.summary-note {
  color: var(--color-muted);
  font-size: var(--font-size-xl);
}

.summary-value {
  overflow-wrap: anywhere;
  font-size: var(--font-size-summary-value);
  line-height: 1.05;
}

.candidate-panel {
  border-bottom: 1px solid var(--color-border);
  padding: 2px 0 18px;
}

.section-heading,
.candidate-main,
.candidate-meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.section-heading {
  margin-bottom: 14px;
}

.section-title {
  margin: 0;
  font-size: var(--font-size-heading);
  font-weight: 750;
  letter-spacing: 0;
  text-transform: uppercase;
}

.section-count,
.candidate-duration,
.candidate-count,
.candidate-members {
  color: var(--color-muted);
  font-size: var(--font-size-xl);
}

.candidate-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  gap: 0 24px;
}

.candidate-item {
  display: grid;
  gap: 9px;
  min-width: 0;
  border-top: 1px solid var(--color-border);
  border-radius: 0;
  padding: 13px 0;
  background: transparent;
}

.candidate-range,
.candidate-members {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
