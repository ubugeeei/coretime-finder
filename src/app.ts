import { defineApp, defineRoute } from "@vuerend/core";
import CoretimeWorkbenchPage from "./features/workbench/CoretimeWorkbenchPage.vue";

const OG_IMAGE_URL = "https://coretime-finder.void.app/og-image.png";

/**
 * Defines the SSR document shell and maps the root URL directly to the workbench feature page.
 *
 * The route component stays inside the feature folder because this application has a single
 * product surface. Keeping the app file focused on document metadata and route registration avoids
 * a second UI route tree next to Void's top-level API route directory.
 */
export default defineApp({
  document: {
    title: "Core Time Finder",
    titleTemplate: "%s",
    lang: "en",
    meta: [
      {
        name: "description",
        content: "Find practical core time windows for people working across time zones.",
      },
      {
        property: "og:title",
        content: "Core Time Finder",
      },
      {
        property: "og:description",
        content: "Visualize availability overlap and share profile-specific core time windows.",
      },
      {
        property: "og:image",
        content: OG_IMAGE_URL,
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
      {
        name: "twitter:image",
        content: OG_IMAGE_URL,
      },
    ],
    links: [
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon.svg",
      },
    ],
    stylesheets: ["/styles/base.css"],
  },
  routes: [
    defineRoute({
      path: "/",
      component: CoretimeWorkbenchPage,
      head: {
        title: "Core Time Finder",
      },
      render: {
        strategy: "ssg",
      },
    }),
  ],
});
