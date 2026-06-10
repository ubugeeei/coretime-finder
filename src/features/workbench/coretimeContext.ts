import type { InjectionKey } from "vue";
import { inject, provide } from "vue";
import type { CoretimeWorkbenchVm } from "../workbench/useCoretimeWorkbench";

const coretimeWorkbenchKey: InjectionKey<CoretimeWorkbenchVm> = Symbol("coretime-workbench");

export function provideCoretimeWorkbench(vm: CoretimeWorkbenchVm): void {
  provide(coretimeWorkbenchKey, vm);
}

export function useCoretimeContext(): CoretimeWorkbenchVm {
  const vm = inject(coretimeWorkbenchKey);
  if (vm === undefined) {
    throw new Error("Coretime workbench context is missing.");
  }

  return vm;
}
