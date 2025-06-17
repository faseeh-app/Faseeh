<script setup lang="ts">
import { onMounted } from 'vue'
import TabBar from './TabBar.vue'
import WindowControls from './WindowControls.vue'
import { usePanelState } from '@renderer/common/composables/usePanelState'
import { Button } from '@renderer/common/components/ui/button'
import {
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
  Tooltip
} from '@renderer/common/components/ui/tooltip'
import { useTabRouter } from '@renderer/core/services/tabRouter'
import { useTabStore } from '@renderer/core/stores/useTabStore'
import { themeService, keyboardShortcutService } from '@renderer/core/services/service-container'

// Panel state management
const { isPanelOpen, togglePanel } = usePanelState()

// Tab management
const tabStore = useTabStore()
const tabRouter = useTabRouter()

// Register keyboard shortcuts on component mount
onMounted(() => {
  registerApplicationShortcuts()
})

function registerApplicationShortcuts() {
  const handleAddTab = () => {
    tabRouter.push({ name: 'library' }, { title: 'Library', newTab: true })
  }

  // Navigation shortcuts
  keyboardShortcutService.registerShortcutHandler({
    id: 'new-tab',
    name: 'New Tab',
    description: 'Open a new library tab',
    category: 'navigation',
    defaultKeys: ['ctrl+t'],
    handler: handleAddTab,
    global: true
  })

  keyboardShortcutService.registerShortcutHandler({
    id: 'close-tab',
    name: 'Close Tab',
    description: 'Close the current tab',
    category: 'navigation',
    defaultKeys: ['ctrl+w'],
    handler: () => {
      const activeTab = tabStore.activeTab
      if (activeTab && activeTab.closable) {
        tabStore.removeTab(activeTab.id)
      }
    },
    global: true
  })

  keyboardShortcutService.registerShortcutHandler({
    id: 'next-tab',
    name: 'Next Tab',
    description: 'Switch to the next tab',
    category: 'navigation',
    defaultKeys: ['ctrl+tab'],
    handler: () => {
      const currentIndex = tabStore.tabs.findIndex((t) => t.id === tabStore.activeTabId)
      const nextIndex = (currentIndex + 1) % tabStore.tabs.length
      const nextTab = tabStore.tabs[nextIndex]
      if (nextTab) {
        tabStore.switchToTab(nextTab.id)
      }
    },
    global: true
  })

  // Theme shortcuts
  keyboardShortcutService.registerShortcutHandler({
    id: 'toggle-theme',
    name: 'Toggle Theme',
    description: 'Switch between light and dark themes',
    category: 'theme',
    defaultKeys: ['ctrl+shift+t'],
    handler: () => {
      const currentTheme = themeService.currentTheme.value
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
      themeService.setTheme(newTheme)
    },
    global: true
  })

  keyboardShortcutService.registerShortcutHandler({
    id: 'light-theme',
    name: 'Light Theme',
    description: 'Switch to light theme',
    category: 'theme',
    defaultKeys: ['ctrl+shift+l'],
    handler: () => {
      themeService.setTheme('light')
    },
    global: true
  })

  keyboardShortcutService.registerShortcutHandler({
    id: 'dark-theme',
    name: 'Dark Theme',
    description: 'Switch to dark theme',
    category: 'theme',
    defaultKeys: ['ctrl+shift+d'],
    handler: () => {
      themeService.setTheme('dark')
    },
    global: true
  })

  // General shortcuts
  keyboardShortcutService.registerShortcutHandler({
    id: 'command-palette',
    name: 'Command Palette',
    description: 'Open the command palette',
    category: 'general',
    defaultKeys: ['ctrl+shift+p'],
    handler: () => {
      // This will be handled by the command palette component
      const event = new CustomEvent('open-command-palette')
      document.dispatchEvent(event)
    },
    global: true
  })

  keyboardShortcutService.registerShortcutHandler({
    id: 'settings',
    name: 'Settings',
    description: 'Open settings dialog',
    category: 'general',
    defaultKeys: ['ctrl+,'],
    handler: () => {
      // This will be handled by the settings component
      const event = new CustomEvent('open-settings')
      document.dispatchEvent(event)
    },
    global: true
  })
}
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
