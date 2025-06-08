<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
  Tooltip
} from '@renderer/common/components/ui/tooltip'
import TabItem from './TabItem.vue'
import TabContextMenu from './TabContextMenu.vue'
import { useTabStore } from '@renderer/common/stores/useTabStore'

const tabStore = useTabStore()
const router = useRouter()

const contextMenu = ref({
  isOpen: false,
  tabId: '',
  x: 0,
  y: 0
})

const isMaximized = ref(false)

function setupWindowStateListener(): void {
  window.electron.ipcRenderer.on('window:maximized-state', (_, state) => {
    isMaximized.value = state
  })

  window.electron.ipcRenderer.send('window:get-maximized-state')
}

onMounted(() => {
  setupWindowStateListener()

  // Add keyboard shortcuts for tab management
  const handleKeyDown = (event: KeyboardEvent) => {
    // Ctrl+T for new tab
    if (event.ctrlKey && event.key === 't') {
      event.preventDefault()
      handleAddTab()
    } // Ctrl+W for close tab
    else if (event.ctrlKey && event.key === 'w') {
      event.preventDefault()
      const activeTab = tabStore.activeTab
      if (activeTab && activeTab.closable) {
        tabStore.removeTab(activeTab.id)
        // Navigate to the new active tab after removal
        const newActiveTab = tabStore.activeTab
        if (newActiveTab) {
          router.push(newActiveTab.route)
        }
      }
    }
    // Ctrl+Tab for next tab
    else if (event.ctrlKey && event.key === 'Tab') {
      event.preventDefault()
      const currentIndex = tabStore.tabs.findIndex((t) => t.id === tabStore.activeTabId)
      const nextIndex = (currentIndex + 1) % tabStore.tabs.length
      const nextTab = tabStore.tabs[nextIndex]
      tabStore.switchToTab(nextTab.id)
      router.push(nextTab.route)
    }
  }

  document.addEventListener('keydown', handleKeyDown)

  // Clean up event listener
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })
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

// Tab event handlers
const handleTabActivate = (tabId: string) => {
  tabStore.switchToTab(tabId)

  // Navigate to the tab's route
  const tab = tabStore.tabs.find((t) => t.id === tabId)
  if (tab) {
    router.push(tab.route)
  }
}

const handleTabClose = (tabId: string) => {
  tabStore.removeTab(tabId)

  // Navigate to the new active tab after removal
  const activeTab = tabStore.activeTab
  if (activeTab) {
    router.push(activeTab.route)
  }
}

const handleTabContextMenu = (tabId: string, event: MouseEvent) => {
  contextMenu.value = {
    isOpen: true,
    tabId,
    x: event.clientX,
    y: event.clientY
  }
}

const handleContextMenuClose = () => {
  contextMenu.value.isOpen = false
}

// Add tab functionality
const handleAddTab = () => {
  // Always create a fresh Library tab without duplicating state
  tabStore.openLibraryTab()
  // Navigate to the library route
  router.push({ name: 'library' })
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

// Tab scrolling functionality
const tabsContainer = ref<HTMLElement>()

const handleTabsWheel = (event: WheelEvent) => {
  if (!tabsContainer.value) return

  // Horizontal scroll with wheel
  event.preventDefault()
  tabsContainer.value.scrollLeft += event.deltaY
}
</script>

<template>
  <div class="faseeh-titlebar">
    <!-- Tabs and controls area -->

    <div class="faseeh-titlebar__content">
      <div class="faseeh-titlebar__center-area">
        <div class="faseeh-titlebar__drag-area"></div>
        <div class="faseeh-titlebar__tabs" ref="tabsContainer" @wheel="handleTabsWheel">
          <TabItem
            v-for="tab in tabStore.tabs"
            :key="tab.id"
            :tab="tab"
            :is-active="tab.id === tabStore.activeTabId"
            @activate="handleTabActivate"
            @close="handleTabClose"
            @context-menu="handleTabContextMenu"
          />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <button class="faseeh-titlebar__tabs__add-button" @click="handleAddTab">
                  <span class="icon-[fluent--add-12-regular] size-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Add Tab</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

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
    </div>

    <!-- Context Menu -->
    <TabContextMenu
      v-if="contextMenu.isOpen"
      :tab="tabStore.tabs.find((t) => t.id === contextMenu.tabId)!"
      :is-open="contextMenu.isOpen"
      :x="contextMenu.x"
      :y="contextMenu.y"
      @close="handleContextMenuClose"
    />
  </div>
</template>
