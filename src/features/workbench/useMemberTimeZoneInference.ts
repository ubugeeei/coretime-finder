import type { ComputedRef, Ref } from "vue";
import { onUnmounted, ref } from "vue";
import { inferTimeZoneCandidates, parseTimeZoneResponse } from "../timezones/timezoneInference";
import type { InferenceState } from "./workbenchTypes";
import type { TimeZoneCandidate } from "../../availability/coretimeTypes";

type InferenceInput = {
  memberRegion: Ref<string>;
  memberTimeZone: Ref<string>;
  supportedTimeZones: ComputedRef<string[]>;
  windowTimeZone: Ref<string>;
};

export function useMemberTimeZoneInference(input: InferenceInput) {
  const inferenceState = ref<InferenceState>({ status: "idle" });
  let inferController: AbortController | undefined;

  async function inferMemberTimeZoneMut(): Promise<void> {
    const query = input.memberRegion.value.trim();
    if (query.length === 0) {
      inferenceState.value = { status: "idle" };
      return;
    }

    inferController?.abort();
    const controller = new AbortController();
    inferController = controller;
    inferenceState.value = { query, status: "loading" };

    try {
      const response = await fetch(`/api/timezones?region=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      });
      const payload = response.ok ? parseTimeZoneResponse(await response.json()) : [];
      applyInferenceResult(query, payload, controller);
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      const fallback = inferTimeZoneCandidates(query, input.supportedTimeZones.value);
      if (fallback.length > 0) {
        applyInferenceResult(query, fallback, controller);
        return;
      }
      inferenceState.value = {
        message: error instanceof Error ? error.message : "Could not infer a time zone.",
        status: "error",
      };
    }
  }

  function applyInferenceResult(
    query: string,
    candidates: TimeZoneCandidate[],
    controller: AbortController,
  ): void {
    const resolved =
      candidates.length > 0
        ? candidates
        : inferTimeZoneCandidates(query, input.supportedTimeZones.value);
    if (controller.signal.aborted) {
      return;
    }
    const first = resolved[0];
    if (first !== undefined) {
      input.memberTimeZone.value = first.timeZone;
      input.windowTimeZone.value = first.timeZone;
    }
    inferenceState.value = { candidates: resolved, query, status: "ok" };
  }

  onUnmounted(() => inferController?.abort());

  return {
    inferMemberTimeZoneMut,
    inferenceState,
  };
}
