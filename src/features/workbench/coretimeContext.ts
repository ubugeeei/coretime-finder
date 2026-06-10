import type { InjectionKey } from "vue";
import { inject, provide } from "vue";
import type { CoretimeWorkbenchVm } from "../workbench/useCoretimeWorkbench";

/**
 * Injection key for the single workbench VM shared by panels inside the hydrated island.
 *
 * Components consume this instead of prop-drilling because the workbench is one coordinated editor
 * with many panels reading and mutating the same state.
 */
const coretimeWorkbenchKey: InjectionKey<CoretimeWorkbenchVm> = Symbol("coretime-workbench");

/** Makes the workbench VM available to nested feature panels. */
export function provideCoretimeWorkbench(vm: CoretimeWorkbenchVm): void {
  provide(coretimeWorkbenchKey, vm);
}

/** Reads the provided workbench VM and fails early if a panel is mounted outside the island. */
export function useCoretimeContext(): CoretimeWorkbenchVm {
  const vm = inject(coretimeWorkbenchKey);
  if (vm === undefined) {
    throw new Error("Coretime workbench context is missing.");
  }

  return vm;
}
