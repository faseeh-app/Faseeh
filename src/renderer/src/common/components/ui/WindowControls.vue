<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import {
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
  Tooltip
} from '@renderer/common/components/ui/tooltip'

const isMaximized = ref(false)

function setupWindowStateListener(): void {
  window.electron.ipcRenderer.on('window:maximized-state', (_, state) => {
    isMaximized.value = state
  })

  window.electron.ipcRenderer.send('window:get-maximized-state')
}

onMounted(() => {
  setupWindowStateListener()
})

onUnmounted(() => {
  window.electron.ipcRenderer.removeAllListeners('window:maximized-state')
})

function minimizeWindow(): void {
  window.electron.ipcRenderer.send('window:minimize')
}

function maximizeWindow(): void {
  window.electron.ipcRenderer.send('window:maximize')
}

function closeWindow(): void {
  window.electron.ipcRenderer.send('window:close')
}

// Computed properties for window controls
const windowControlIcon = computed(() => {
  return isMaximized.value
    ? 'icon-[fluent--square-multiple-16-regular]'
    : 'icon-[fluent--square-12-regular]'
})

const windowControlTooltip = computed(() => {
  return isMaximized.value ? 'Restore' : 'Maximize'
})
</script>

<template>
  <div class="faseeh-titlebar__window-controls">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger as-child>
          <button class="faseeh-titlebar__window-controls__button" @click="minimizeWindow">
            <span class="icon-[fluent--minimize-16-regular]" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Minimize</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger as-child>
          <button class="faseeh-titlebar__window-controls__button" @click="maximizeWindow">
            <span :class="windowControlIcon" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{{ windowControlTooltip }}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger as-child>
          <button class="faseeh-titlebar__window-controls__button--danger" @click="closeWindow">
            <span class="icon-[eva--close-fill]" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Close</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
</template>
