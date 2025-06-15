<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import TabItem from './TabItem.vue'
import AddTabButton from './AddTabButton.vue'
import TabContextMenu from './TabContextMenu.vue'
import { useTabStore } from '@renderer/core/stores/useTabStore'

const tabStore = useTabStore()
const router = useRouter()

const contextMenu = ref({
  isOpen: false,
  tabId: '',
  x: 0,
  y: 0
})

// Tab event handlers
const handleTabActivate = (tabId: string) => {
  tabStore.switchToTab(tabId)

  // Navigate to the tab's current route
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
</script>

<template>
  <div class="faseeh-titlebar__container">
    <div class="faseeh-titlebar__tabs">
      <TabItem
        v-for="tab in tabStore.tabs"
        :key="tab.id"
        :tab="tab"
        :is-active="tab.id === tabStore.activeTabId"
        @activate="handleTabActivate"
        @close="handleTabClose"
        @context-menu="handleTabContextMenu"
      />
    </div>

    <AddTabButton />

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
