<script setup lang="ts">
import { CoretimeWorkbenchIsland } from "./workbenchIslands";
</script>

<template>
  <!-- @vize:docs Route-level page for the application. It intentionally delegates the interactive workbench to the hydrated island so the Vuerend route stays as a readable product entry point instead of forwarding bootstrap props. -->
  <CoretimeWorkbenchIsland />
</template>
