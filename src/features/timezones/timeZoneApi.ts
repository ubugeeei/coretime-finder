import { defineHandler } from "void";
import { inferTimeZoneCandidates } from "./timezoneInference";

/**
 * Handles region-to-time-zone inference requests for the workbench forms.
 *
 * The implementation lives beside the time zone feature because it shares the same inference table
 * and scoring behavior as the client-side fallback. The top-level `routes/` file only re-exports
 * this handler so Void can discover the API route without forcing route logic into a second source
 * tree.
 */
export const GET = defineHandler(function getTimeZoneCandidates(context) {
  const region = context.req.query("region") ?? "";

  // Keep API responses small because the form only presents a short ranked suggestion list.
  return {
    candidates: inferTimeZoneCandidates(region).slice(0, 8),
  };
});
