import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTabStore } from '@renderer/common/stores/useTabStore'

export function useKeyboardShortcuts() {
  const tabStore = useTabStore()
  const router = useRouter()

  const handleAddTab = () => {
    // Always create a fresh Library tab without duplicating state
    tabStore.openLibraryTab()
    // Navigate to the library route
    router.push({ name: 'library' })
  }

  onMounted(() => {
    // Add keyboard shortcuts for tab management
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+T for new tab
      if (event.ctrlKey && event.key === 't') {
        event.preventDefault()
        handleAddTab()
      }
      // Ctrl+W for close tab
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
}
