import { onMounted, onUnmounted, ref } from "vue";
import { getCurrentInstantEpochMilliseconds } from "../../availability/timeZoneMath";

/**
 * Tracks the current instant for "now" badges without forcing every timeline calculation to poll.
 *
 * The value updates every 30 seconds, which is frequent enough for minute-level local-time labels
 * while keeping idle tabs cheap.
 */
export function useCurrentInstant() {
  const currentInstant = ref(getCurrentInstantEpochMilliseconds());
  let timer: ReturnType<typeof setInterval> | undefined;

  onMounted(() => {
    currentInstant.value = getCurrentInstantEpochMilliseconds();
    timer = setInterval(() => {
      currentInstant.value = getCurrentInstantEpochMilliseconds();
    }, 30_000);
  });

  onUnmounted(() => {
    if (timer !== undefined) {
      clearInterval(timer);
    }
  });

  return currentInstant;
}
