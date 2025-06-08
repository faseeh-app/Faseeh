import { nextTick, onActivated, onDeactivated, computed, type Ref } from 'vue'
import { useScroll } from '@vueuse/core'
import { useTabStore } from '@renderer/common/stores/useTabStore'

export function useScrollPosition(scrollAreaRef: Ref<any>) {
  const tabStore = useTabStore()

  let currentTabId: string | null = null

  const scrollViewport = computed(() => {
    return scrollAreaRef.value?.$el?.querySelector(
      '[data-slot="scroll-area-viewport"]'
    ) as HTMLElement | null
  })
  const { x: scrollX, y: scrollY } = useScroll(scrollViewport, {
    behavior: 'auto'
  })

  const saveScrollPosition = () => {
    if (scrollViewport.value && currentTabId) {
      tabStore.setTabState(currentTabId, 'scrollY', scrollY.value)
      tabStore.setTabState(currentTabId, 'scrollX', scrollX.value)
    }
  }
  const setupScrollTracking = async () => {
    currentTabId = tabStore.activeTabId
    await restoreScrollPosition()
  }

  const restoreScrollPosition = async () => {
    if (!scrollViewport.value || !currentTabId) return

    await nextTick()

    const savedScrollTop = tabStore.getTabState(currentTabId, 'scrollY')
    const savedScrollLeft = tabStore.getTabState(currentTabId, 'scrollX')

    if (typeof savedScrollTop === 'number') {
      scrollY.value = savedScrollTop
    }
    if (typeof savedScrollLeft === 'number') {
      scrollX.value = savedScrollLeft
    }
  }

  onActivated(setupScrollTracking)
  onDeactivated(saveScrollPosition)

  return {
    saveScrollPosition,
    restoreScrollPosition,
    setupScrollTracking
  }
}
