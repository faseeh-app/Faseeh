<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Button } from '@renderer/common/components/ui/button'
import ScrollArea from '@renderer/common/components/ui/scroll-area/ScrollArea.vue'
import { useTabRouter } from '@renderer/common/services/tabRouter'
import { useTabStore } from '@renderer/common/stores/useTabStore'

interface Props {
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: ''
})

const route = useRoute()
const tabRouter = useTabRouter()
const tabStore = useTabStore()
const scrollAreaRef = ref()

// Computed title that prioritizes tab title (which comes from media card)
const displayTitle = computed(() => {
  // First check if there's an explicit prop
  if (props.title) return props.title

  // Then check the active tab title (this is where media card titles are stored)
  if (tabStore.activeTab?.title) return tabStore.activeTab.title

  // Fallback to route meta or params
  if (route.meta?.title) return route.meta.title as string
  if (route.params?.title) return route.params.title as string

  // Final fallback
  return 'Media'
})

// Navigation handlers
const handleGoBack = async () => {
  // Try to go back in tab history first
  const hasHistory = tabRouter.canGoBack
  if (hasHistory) {
    const success = await tabRouter.back()
    if (success) {
      return
    }
  }

  // If no history or back navigation failed, go to library
  await tabRouter.push({ name: 'library' }, { title: 'Library' })
}

const handleGoForward = () => {
  // Forward functionality can be implemented later if needed
  console.log('Forward navigation not implemented')
}

const handleMoreActions = () => {
  // Placeholder for more actions (share, download, etc.)
  console.log('More actions clicked')
}

// Always enable back button for media layout - either go back in history or return to library
const canGoBack = computed(() => true)
</script>
<template>
  <div class="flex flex-col h-full min-h-0">
    <div class="faseeh-media-bar">
      <div class="faseeh-media-bar__navigation">
        <Button
          variant="ghost"
          size="icon"
          class="faseeh-media-bar__navigation-button"
          :disabled="!canGoBack"
          @click="handleGoBack"
        >
          <span class="icon-[famicons--chevron-back-outline]"></span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="faseeh-media-bar__navigation-button"
          disabled
          @click="handleGoForward"
        >
          <span class="icon-[famicons--chevron-forward-outline]"></span>
        </Button>
      </div>

      <div class="faseeh-media-bar__title">{{ displayTitle }}</div>
      <div class="faseeh-media-bar__actions">
        <Button
          variant="ghost"
          size="icon"
          class="faseeh-media-bar__action-button"
          @click="handleMoreActions"
        >
          <span class="icon-[heroicons-solid--dots-vertical]"></span>
        </Button>
      </div>
    </div>
    <ScrollArea ref="scrollAreaRef" class="flex-grow h-1">
      <div class="h-full">
        <RouterView />
      </div>
    </ScrollArea>
  </div>
</template>

<style scoped>
/* Force ScrollArea viewport to respect container height */
.flex-grow :deep([data-reka-scroll-area-viewport]) {
  max-height: 100%;
  height: 100%;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}

/* Ensure the inner div wrapper also respects height */
.flex-grow :deep([data-reka-scroll-area-viewport] > div) {
  max-height: 100%;
}

.flex-grow :deep([data-reka-scroll-area-viewport]::-webkit-scrollbar) {
  display: none; /* Chrome, Safari, Opera */
}
</style>
