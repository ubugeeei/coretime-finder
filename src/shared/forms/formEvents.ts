type ValueTarget = EventTarget & { value: string };

export function eventStringValue(event: Event): string {
  return (event.currentTarget as ValueTarget | null)?.value ?? "";
}

export function eventNumberValue(event: Event): number {
  return Number(eventStringValue(event));
}
