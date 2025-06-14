<script setup lang="ts">
import TabBar from './TabBar.vue'
import WindowControls from './WindowControls.vue'
import { useKeyboardShortcuts } from '@renderer/common/composables/useKeyboardShortcuts'

// Setup keyboard shortcuts for tab management
useKeyboardShortcuts()
</script>

<template>
  <div class="faseeh-titlebar">
    <!-- Tabs and controls area -->
    <div class="faseeh-titlebar__center-area">
      <div class="faseeh-titlebar__drag-area"></div>
      <TabBar />
    </div>

    <WindowControls />
  </div>
</template>
