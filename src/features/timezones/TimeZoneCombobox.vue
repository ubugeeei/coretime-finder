<script setup lang="ts">
import { computed, ref } from "vue";
import { formatTimeZoneLabel } from "../../availability/timeZoneMath";
import TimeZonePickerDialog from "./TimeZonePickerDialog.vue";

const { id, label, modelValue, referenceDate, timeZones } = defineProps<{
  id: string;
  label: string;
  modelValue: string;
  referenceDate: string;
  timeZones: readonly string[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const isDialogOpen = ref(false);
const dialogId = computed(() => `${id}-dialog`);
const selectedLabel = computed<string>(() =>
  formatTimeZoneLabel(selectedTimeZone(), selectedReferenceDate()),
);

function selectedTimeZone(): string {
  return modelValue;
}

function selectedReferenceDate(): string {
  return referenceDate;
}

function openDialog(): void {
  isDialogOpen.value = true;
}

function closeDialog(): void {
  isDialogOpen.value = false;
}

function selectTimeZone(timeZone: string): void {
  emit("update:modelValue", timeZone);
  isDialogOpen.value = false;
}
</script>

<template>
  <div class="field timezone-combobox">
    <label :for="id">{{ label }}</label>
    <button
      :id="id"
      :aria-expanded="isDialogOpen"
      aria-haspopup="dialog"
      class="timezone-trigger"
      type="button"
      @click="openDialog"
    >
      <span class="timezone-label">{{ selectedLabel }}</span>
    </button>
    <TimeZonePickerDialog
      v-if="isDialogOpen"
      :id="dialogId"
      :model-value
      :reference-date
      :time-zones
      @close="closeDialog"
      @update:model-value="selectTimeZone"
    />
  </div>
</template>

<style scoped>
.timezone-combobox {
  min-width: 0;
}

.timezone-trigger {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 36px;
  border: 1px solid var(--color-border);
  border-radius: 0;
  padding: 7px 9px;
  color: var(--color-ink);
  text-align: left;
  background: var(--color-surface);
}

.timezone-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
