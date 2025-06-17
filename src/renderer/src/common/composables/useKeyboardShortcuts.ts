import { onMounted, onUnmounted } from 'vue'
import { useTabRouter } from '@renderer/core/services/tabRouter'
import { useTabStore } from '@renderer/core/stores/useTabStore'
import { themeService } from '@renderer/core/services/service-container'

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

      pressedKeys.add(keyCombo) // Ctrl+T for new tab
      if (event.ctrlKey && event.key === 't') {
        event.preventDefault()
        handleAddTab()
      } // Ctrl+Shift+T for theme toggle
      else if (event.ctrlKey && event.shiftKey && event.key === 'T') {
        event.preventDefault()
        const currentTheme = themeService.currentTheme.value
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
        themeService.setTheme(newTheme)
      }
      // Ctrl+Shift+L for light theme
      else if (event.ctrlKey && event.shiftKey && event.key === 'L') {
        event.preventDefault()
        themeService.setTheme('light')
      }
      // Ctrl+Shift+D for dark theme
      else if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault()
        themeService.setTheme('dark')
      }
      // Ctrl+W for close tab
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
