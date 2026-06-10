<script setup lang="ts">
import { computed, useId } from "vue";
import { useCoretimeContext } from "../workbench/coretimeContext";
import { formatTimeZoneLabel } from "../../availability/timeZoneMath";
import { eventStringValue } from "../../shared/forms/formEvents";
import PeopleList from "./PeopleList.vue";
import TimeZoneCombobox from "../timezones/TimeZoneCombobox.vue";
import WorkWindowPanel from "./WorkWindowPanel.vue";

const {
  addMemberMut,
  inferMemberTimeZoneMut,
  inferenceState,
  memberDraftError,
  memberEnd,
  memberName,
  memberRegion,
  memberStart,
  memberTimeZone,
  referenceDate,
  supportedTimeZones,
} = useCoretimeContext();

const memberEndId = useId();
const memberEndValue = computed<string>(() => memberEnd.value);
const memberNameId = useId();
const memberNameValue = computed<string>(() => memberName.value);
const memberRegionId = useId();
const memberRegionValue = computed<string>(() => memberRegion.value);
const memberStartId = useId();
const memberStartValue = computed<string>(() => memberStart.value);
const memberTimeZoneId = useId();
const memberTimeZoneValue = computed<string>(() => memberTimeZone.value);
const referenceDateValue = computed<string>(() => referenceDate.value);
const supportedTimeZoneValues = computed<readonly string[]>(() => supportedTimeZones.value);
const hasInferenceError = computed<boolean>(() => inferenceState.value.status === "error");
const hasInferenceLoading = computed<boolean>(() => inferenceState.value.status === "loading");
const hasInferenceOk = computed<boolean>(() => inferenceState.value.status === "ok");
const inferenceErrorLabel = computed<string>(() =>
  inferenceState.value.status === "error" ? inferenceState.value.message : "",
);
const inferenceLoadingLabel = computed<string>(() =>
  inferenceState.value.status === "loading" ? `Looking up ${inferenceState.value.query}` : "",
);
const inferenceResultLabel = computed<string>(() => {
  if (inferenceState.value.status !== "ok") {
    return "";
  }
  const candidate = inferenceState.value.candidates[0];
  if (candidate === undefined) {
    return `No match for ${inferenceState.value.query}`;
  }

  return `${candidate.label} / ${zoneLabel(candidate.timeZone)}`;
});
const memberDraftErrorLabel = computed<string>(() =>
  memberDraftError.value.status === "invalid" ? memberDraftError.value.message : "",
);

function zoneLabel(timeZone: string): string {
  return formatTimeZoneLabel(timeZone, readReferenceDate());
}

function readReferenceDate(): string {
  return referenceDate.value;
}

function addMember(): void {
  addMemberMut();
}

function inferMemberTimeZone(): void {
  inferMemberTimeZoneMut();
}

function updateMemberEnd(event: Event): void {
  memberEnd.value = eventStringValue(event);
}

function updateMemberName(event: Event): void {
  memberName.value = eventStringValue(event);
}

function updateMemberRegion(event: Event): void {
  memberRegion.value = eventStringValue(event);
}

function updateMemberStart(event: Event): void {
  memberStart.value = eventStringValue(event);
}

function updateMemberTimeZone(value: string): void {
  memberTimeZone.value = value;
}
</script>

<template>
  <aside class="control-column" aria-label="People editor">
    <PeopleList />

    <section class="panel">
      <div class="section-heading">
        <p class="section-title">Add person</p>
      </div>

      <form class="stack-form">
        <div class="field">
          <label :for="memberNameId">Name</label>
          <input
            :id="memberNameId"
            :value="memberNameValue"
            autocomplete="off"
            @input="updateMemberName"
          />
        </div>
        <div class="field">
          <label :for="memberRegionId">Region</label>
          <div class="inline-field">
            <input
              :id="memberRegionId"
              :value="memberRegionValue"
              autocomplete="off"
              placeholder="City or region"
              @input="updateMemberRegion"
            />
            <button class="button secondary" type="button" @click="inferMemberTimeZone">
              Infer
            </button>
          </div>
        </div>
        <div v-if="hasInferenceOk" class="inference-result">
          {{ inferenceResultLabel }}
        </div>
        <div v-else-if="hasInferenceLoading" class="inference-result">
          {{ inferenceLoadingLabel }}
        </div>
        <div v-else-if="hasInferenceError" class="form-error">
          {{ inferenceErrorLabel }}
        </div>
        <TimeZoneCombobox
          :id="memberTimeZoneId"
          label="Time zone"
          :model-value="memberTimeZoneValue"
          :reference-date="referenceDateValue"
          :time-zones="supportedTimeZoneValues"
          @update:model-value="updateMemberTimeZone"
        />
        <div class="two-col">
          <div class="field">
            <label :for="memberStartId">Start</label>
            <input
              :id="memberStartId"
              :value="memberStartValue"
              type="time"
              @input="updateMemberStart"
            />
          </div>
          <div class="field">
            <label :for="memberEndId">End</label>
            <input :id="memberEndId" :value="memberEndValue" type="time" @input="updateMemberEnd" />
          </div>
        </div>
        <p v-if="memberDraftErrorLabel.length > 0" class="form-error">
          {{ memberDraftErrorLabel }}
        </p>
        <button class="button primary" type="button" @click="addMember">Add person</button>
      </form>
    </section>

    <WorkWindowPanel />
  </aside>
</template>

<style scoped>
.control-column {
  display: grid;
  align-content: start;
  gap: 24px;
  min-width: 0;
  border-inline-end: 1px solid var(--color-border);
  padding-inline-end: 24px;
}

.panel {
  border: 0;
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

.stack-form {
  display: grid;
  gap: 12px;
}

.button {
  min-height: 36px;
  border: 1px solid var(--color-ink);
  border-radius: 0;
  padding: 7px 12px;
  font-weight: 750;
}

.button.primary {
  color: var(--color-bg);
  background: var(--color-ink);
}

.button.secondary {
  color: var(--color-ink);
  border-color: var(--color-border-strong);
  background: transparent;
}

.form-error {
  margin: 0;
  color: var(--color-danger);
  font-size: var(--font-size-form);
}

.inference-result {
  margin: 0;
  border: 1px solid var(--color-border);
  border-radius: 0;
  padding: 8px 10px;
  color: var(--color-muted);
  background: transparent;
  font-size: var(--font-size-form);
}

.two-col,
.inline-field {
  display: grid;
  gap: 10px;
}

.two-col {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 120px), 1fr));
}

.inline-field {
  grid-template-columns: minmax(0, 1fr) auto;
}
</style>
