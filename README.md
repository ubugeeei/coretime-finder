# Core Time Finder

Core Time Finder visualizes possible overlap windows for people working across different time zones.

## Browser Runtime

The interactive workbench uses JavaScript `Temporal` for time zone math.
Browsers without native `Temporal` support use the packaged `temporal-polyfill-lite` fallback.
