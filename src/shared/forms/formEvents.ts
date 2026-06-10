type ValueTarget = EventTarget & { value: string };

/** Reads a string value from form events without repeating DOM casts in Vue components. */
export function eventStringValue(event: Event): string {
  return (event.currentTarget as ValueTarget | null)?.value ?? "";
}

/** Reads a numeric value from form events while keeping the component template handlers small. */
export function eventNumberValue(event: Event): number {
  return Number(eventStringValue(event));
}
