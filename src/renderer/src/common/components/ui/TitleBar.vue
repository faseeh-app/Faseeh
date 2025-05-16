<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import HSpacer from '@renderer/common/components/ui/Spacer.vue'
import TooltipProvider from '@renderer/common/components/ui/tooltip/TooltipProvider.vue'
import TooltipTrigger from './tooltip/TooltipTrigger.vue'
import TooltipContent from './tooltip/TooltipContent.vue'
import Tooltip from './tooltip/Tooltip.vue'
import { Button } from '@renderer/common/components/ui/button'

// Track window maximized state
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

const windowControls = [
  {
    id: 'minimize',
    icon: 'icon-[fluent--minimize-16-regular]',
    action: minimizeWindow,
    tooltip: 'Minimize',
    class: 'faseeh-titlebar__window-controls__button'
  },
  {
    id: 'maximize',
    icon: isMaximized.value
      ? 'icon-[fluent--square-multiple-16-regular]'
      : 'icon-[fluent--square-12-regular]',
    action: maximizeWindow,
    tooltip: isMaximized.value ? 'Restore' : 'Maximize',
    class: 'faseeh-titlebar__window-controls__button'
  },
  {
    id: 'close',
    icon: 'icon-[eva--close-fill]',
    action: closeWindow,
    tooltip: 'Close',
    class: 'faseeh-titlebar__window-controls__button--danger'
  }
]
</script>

<template>
  <TooltipProvider>
    <div class="faseeh-titlebar">
      <div class="faseeh-titlebar__tabs">
        <div class="faseeh-titlebar__tabs__item">
          <span>Library</span>
          <Button variant="ghost" size="icon" class="faseeh-titlebar__tabs__item__button">
            <span class="icon-[fluent-emoji-high-contrast--multiply] size-2.5" />
          </Button>
        </div>

        <div class="faseeh-titlebar__tabs__item">
          <span>Settings</span>
          <Button variant="ghost" size="icon" class="faseeh-titlebar__tabs__item__button">
            <span class="icon-[fluent-emoji-high-contrast--multiply] size-2.5" />
          </Button>
        </div>
      </div>
      <HSpacer />
      <div class="faseeh-titlebar__window-controls">
        <Tooltip v-for="control in windowControls" :key="control.id">
          <TooltipTrigger as-child>
            <button :class="control.class" @click="control.action">
              <span :class="control.icon" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{{ control.tooltip }}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  </TooltipProvider>
</template>
