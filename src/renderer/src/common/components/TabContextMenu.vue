<script setup lang="ts">
import { computed } from 'vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@renderer/common/components/ui/dropdown-menu'
import { useTabStore, type Tab } from '@renderer/core/stores/useTabStore'
import { useRouter } from 'vue-router'

interface Props {
  tab: Tab
  isOpen: boolean
  x: number
  y: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const tabStore = useTabStore()
const router = useRouter()

const canClose = computed(() => props.tab.closable)
const canDuplicate = computed(() => true)
const hasOtherTabs = computed(() => tabStore.closableTabs.length > 0)

const handleCloseTab = () => {
  if (canClose.value) {
    tabStore.removeTab(props.tab.id)

    // Navigate to the new active tab after removal
    const activeTab = tabStore.activeTab
    if (activeTab) {
      router.push(activeTab.route)
    }
  }
  emit('close')
}

const handleCloseOtherTabs = () => {
  tabStore.closeOtherTabs(props.tab.id)

  // Ensure we navigate to the remaining tab (which should be the current one)
  const activeTab = tabStore.activeTab
  if (activeTab) {
    router.push(activeTab.route)
  }

  emit('close')
}

const handleCloseAllTabs = () => {
  tabStore.closeAllClosableTabs()

  // Navigate to the remaining active tab
  const activeTab = tabStore.activeTab
  if (activeTab) {
    router.push(activeTab.route)
  }

  emit('close')
}

const handleDuplicateTab = () => {
  const newTabId = tabStore.duplicateTab(props.tab.id)

  // Navigate to the duplicated tab
  const newTab = tabStore.tabs.find((t) => t.id === newTabId)
  if (newTab) {
    router.push(newTab.route)
  }

  emit('close')
}

const handleReloadTab = () => {
  // Use the store method which handles events and navigation
  tabStore.reloadTab(props.tab.id)
  router.push(props.tab.route)
  emit('close')
}
</script>

<template>
  <DropdownMenu :open="isOpen" @update:open="!$event && $emit('close')">
    <DropdownMenuTrigger as-child>
      <div class="fixed w-1 h-1 pointer-events-none" :style="{ left: `${x}px`, top: `${y}px` }" />
    </DropdownMenuTrigger>

    <DropdownMenuContent side="bottom" align="start" class="w-48">
      <DropdownMenuItem @click="handleReloadTab">
        <span class="icon-[solar--refresh-linear] size-4 mr-2" />
        Reload Tab
      </DropdownMenuItem>

      <DropdownMenuItem v-if="canDuplicate" @click="handleDuplicateTab">
        <span class="icon-[solar--copy-linear] size-4 mr-2" />
        Duplicate Tab
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem v-if="canClose" @click="handleCloseTab">
        <span class="icon-[solar--close-circle-linear] size-4 mr-2" />
        Close Tab
      </DropdownMenuItem>

      <DropdownMenuItem v-if="hasOtherTabs" @click="handleCloseOtherTabs">
        <span class="icon-[solar--close-square-linear] size-4 mr-2" />
        Close Other Tabs
      </DropdownMenuItem>

      <DropdownMenuItem v-if="hasOtherTabs" @click="handleCloseAllTabs">
        <span class="icon-[solar--close-circle-bold] size-4 mr-2" />
        Close All Tabs
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
