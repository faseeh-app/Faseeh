<script setup lang="ts">
import TabBar from './TabBar.vue'
import WindowControls from './WindowControls.vue'
import { useKeyboardShortcuts } from '@renderer/common/composables/useKeyboardShortcuts'
import { usePanelState } from '@renderer/common/composables/usePanelState'
import { Button } from '@renderer/common/components/ui/button'
import {
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
  Tooltip
} from '@renderer/common/components/ui/tooltip'

// Setup keyboard shortcuts for tab management
useKeyboardShortcuts()

// Panel state management
const { isPanelOpen, togglePanel } = usePanelState()
</script>

<template>
  <div class="faseeh-titlebar">
    <!-- Tabs and controls area -->
    <div class="faseeh-titlebar__center-area">
      <div class="faseeh-titlebar__drag-area"></div>
      <TabBar />
    </div>
    <div class="faseeh-titlebar__sidepanel-toggle">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="faseeh-titlebar__sidepanel-toggle-button"
              :class="{ 'bg-accent': isPanelOpen }"
              @click="togglePanel"
            >
              <span class="icon-[qlementine-icons--ui-panel-right-16]"></span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {{ isPanelOpen ? 'Hide Side Panel' : 'Show Side Panel' }}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
    <WindowControls />
  </div>
</template>
