import { defineIsland, defineIslands } from "@vuerend/core";
import type { WorkbenchBootstrapState } from "./workbenchTypes";

/** Optional island props allow SSR bootstrap defaults to be filled in by the island component. */
export type CoretimeWorkbenchIslandProps = Partial<WorkbenchBootstrapState>;

/**
 * Registers the single interactive island used by the product page.
 *
 * The route renders a small SSR page shell, while this island owns the hydrated workbench state,
 * profile persistence, share URL restoration, and all user editing actions. Keeping the registry
 * beside the workbench feature avoids a generic app -> routes -> islands chain for a one-screen app.
 */
export const CoretimeWorkbenchIsland = defineIsland<CoretimeWorkbenchIslandProps>(
  "coretime-workbench",
  {
    hydrate: "load",
    load: () => import("./CoretimeWorkbenchIsland.vue"),
    ssr: false,
  },
);

export default defineIslands([CoretimeWorkbenchIsland]);
