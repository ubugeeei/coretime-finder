import { onMounted, onUnmounted, ref } from "vue";
import { getCurrentInstantEpochMilliseconds } from "../../availability/timeZoneMath";

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
