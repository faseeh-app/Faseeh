<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { cn } from '@renderer/common/lib/utils'
import { usePanelState } from '@renderer/common/composables/usePanelState'
import PluginUIContainer from './PluginUIContainer.vue'
import ScrollArea from './scroll-area/ScrollArea.vue'

interface Props {
  initialWidth?: number
  minWidth?: number
  maxWidth?: number
  position?: 'left' | 'right'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  initialWidth: 300,
  minWidth: 200,
  maxWidth: 600,
  position: 'right'
})

const panelRef = ref<HTMLElement>()
const resizeHandleRef = ref<HTMLElement>()
const isResizing = ref(false)

const { panelWidth, isPanelOpen, setPanelWidth, togglePanel } = usePanelState()

let startX = 0
let startWidth = 0
let virtualWidth = 0
const AUTO_CLOSE_WIDTH = 50

const handleMouseDown = (e: MouseEvent) => {
  isResizing.value = true
  startX = e.clientX
  startWidth = panelWidth.value
  virtualWidth = panelWidth.value

  document.body.style.cursor = 'ew-resize'
  document.body.style.userSelect = 'none'

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isResizing.value) return

  const deltaX = props.position === 'left' ? e.clientX - startX : startX - e.clientX
  virtualWidth = startWidth + deltaX // Track actual drag position

  if (!isPanelOpen.value) {
    if (virtualWidth > AUTO_CLOSE_WIDTH) togglePanel()
    else return
  }

  // Clamp displayed width between min and max, but allow virtual width to go below min
  const displayWidth = Math.min(Math.max(virtualWidth, props.minWidth), props.maxWidth)

  if (virtualWidth < AUTO_CLOSE_WIDTH && isPanelOpen.value) {
    // Close the panel but keep tracking virtual width
    togglePanel()
    return
  }

  setPanelWidth(displayWidth)
}

const handleMouseUp = () => {
  isResizing.value = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''

  if (isPanelOpen.value) {
    virtualWidth = panelWidth.value
  } else {
    // If panel is closed, reset width to initial for next open
    setPanelWidth(props.initialWidth)
    virtualWidth = props.initialWidth
  }

  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

onUnmounted(() => {
  if (isResizing.value) {
    handleMouseUp()
  }
})
</script>

<template>
  <div
    v-if="isPanelOpen"
    ref="panelRef"
    :class="cn('relative flex flex-col bg-background border-l border-input', props.class)"
    :style="{ width: `${panelWidth}px` }"
  >
    <!-- Resize handle -->
    <div
      ref="resizeHandleRef"
      :class="
        cn(
          'absolute top-0 h-full w-1 cursor-ew-resize hover:bg-primary transition-colors z-50 bg-border opacity-30 hover:opacity-80',
          position === 'left' ? '-left-0.5' : '-left-0.5'
        )
      "
      @mousedown="handleMouseDown"
    />
    <!-- Panel content -->
    <ScrollArea class="flex-1 h-1">
      <PluginUIContainer class="h-full" />
    </ScrollArea>
  </div>
</template>

<style scoped>
/* Apply scrollbar-hide to the ScrollArea viewport */
:deep([data-reka-scroll-area-viewport]) {
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* Internet Explorer 10+ */
}

:deep([data-reka-scroll-area-viewport]::-webkit-scrollbar) {
  display: none; /* WebKit */
}
</style>
