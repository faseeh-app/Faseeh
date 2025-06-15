import { onMounted, onUnmounted } from 'vue'
import { useTabRouter } from '@root/src/renderer/src/core/services/tabRouter'
import { useTabStore } from '@root/src/renderer/src/core/stores/useTabStore'

export function useKeyboardShortcuts() {
  const tabStore = useTabStore()
  const tabRouter = useTabRouter()
  const pressedKeys = new Set<string>()
  const handleAddTab = () => {
    tabRouter.push({ name: 'library' }, { title: 'Library', newTab: true })
  }

  onMounted(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const keyCombo = `${event.ctrlKey ? 'ctrl+' : ''}${event.shiftKey ? 'shift+' : ''}${event.altKey ? 'alt+' : ''}${event.key.toLowerCase()}`
      if (pressedKeys.has(keyCombo)) {
        return
      }

      pressedKeys.add(keyCombo)

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
          // Navigation will be handled by the TabBar component
        }
      }

      // Ctrl+Tab for next tab
      else if (event.ctrlKey && event.key === 'Tab') {
        event.preventDefault()
        const currentIndex = tabStore.tabs.findIndex((t) => t.id === tabStore.activeTabId)
        const nextIndex = (currentIndex + 1) % tabStore.tabs.length
        const nextTab = tabStore.tabs[nextIndex]
        tabStore.switchToTab(nextTab.id)
        // Navigation will be handled by the TabBar component
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      // Create a unique key combination identifier
      const keyCombo = `${event.ctrlKey ? 'ctrl+' : ''}${event.shiftKey ? 'shift+' : ''}${event.altKey ? 'alt+' : ''}${event.key.toLowerCase()}`

      // Remove from pressed keys set when key is released
      pressedKeys.delete(keyCombo)

      // Also handle the case where modifier keys are released
      if (!event.ctrlKey) {
        // Remove all ctrl+ combinations when ctrl is released
        for (const key of pressedKeys) {
          if (key.startsWith('ctrl+')) {
            pressedKeys.delete(key)
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      pressedKeys.clear()
    })
  })
}
