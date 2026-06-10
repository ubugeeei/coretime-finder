<script setup lang="ts">
import type { SerializedMember } from "../../availability/coretimeTypes";
import MemberControls from "../people/MemberControls.vue";
import ProfileControls from "../profiles/ProfileControls.vue";
import SummaryBand from "../summary/SummaryBand.vue";
import WorkbenchCredit from "./WorkbenchCredit.vue";
import WorkbenchTopbar from "./WorkbenchTopbar.vue";
import { provideCoretimeWorkbench } from "./coretimeContext";
import { createWorkbenchBootstrapState } from "./workbenchBootstrap";
import type { WorkbenchBootstrapState } from "./workbenchTypes";
import { useCoretimeWorkbench } from "./useCoretimeWorkbench";

const { members, referenceDate, referenceTimeZone } = defineProps<{
  members?: SerializedMember[];
  referenceDate?: string;
  referenceTimeZone?: string;
}>();
const vm = useCoretimeWorkbench(resolveBootstrapState(readBootstrapProps));

/**
 * Merges optional island props with the product bootstrap state.
 *
 * SSR callers may provide a complete state object, a partial state, or no props at all. The island
 * normalizes those inputs before creating the workbench VM so the composable never has to know
 * about Vue prop defaults or route-level mounting details.
 */
function readBootstrapProps(): Partial<WorkbenchBootstrapState> {
  return { members, referenceDate, referenceTimeZone };
}

function resolveBootstrapState(
  readInput: () => Partial<WorkbenchBootstrapState>,
): WorkbenchBootstrapState {
  const fallback = createWorkbenchBootstrapState();
  const input = readInput();

  return {
    members: input.members ?? fallback.members,
    referenceDate: input.referenceDate ?? fallback.referenceDate,
    referenceTimeZone: input.referenceTimeZone ?? fallback.referenceTimeZone,
  };
}

provideCoretimeWorkbench(vm);
</script>

<template>
  <!-- @vize:docs Hydrated workbench island. This is the only client-side state boundary for editing people, work windows, profiles, share URLs, and timeline visualization. -->
  <div class="shell">
    <WorkbenchTopbar />
    <ProfileControls />

    <main class="workspace">
      <MemberControls />
      <SummaryBand />
    </main>

    <WorkbenchCredit />
  </div>
</template>

<style scoped>
.shell {
  width: min(1440px, 100%);
  margin: 0 auto;
  min-height: 100vh;
  padding: clamp(16px, 2.3vw, 32px);
}

.workspace {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr));
  gap: 32px;
  margin-top: 30px;
}
</style>
