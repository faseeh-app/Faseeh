import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { RouteNames } from '@renderer/common/router/routes'
import { workspaceEvents } from '@shared/constants/event-emitters'

export interface Tab {
  id: string
  title: string
  route: {
    name: string
    params?: Record<string, any>
    query?: Record<string, any>
  }
  closable: boolean
  isDirty?: boolean // For unsaved changes indicator
  state?: Record<string, any> // Independent state storage for each tab
  lastAccessed?: number // Timestamp for tab management
}

export const useTabStore = defineStore('tabs', () => {
  // State
  const initialTabId = `tab_${Date.now()}_initial`
  const tabs = ref<Tab[]>([
    {
      id: initialTabId,
      title: 'Library',
      route: { name: RouteNames.LIBRARY },
      closable: true
    }
  ])

  const activeTabId = ref<string>(initialTabId)

  // Getters
  const activeTab = computed(() => tabs.value.find((tab) => tab.id === activeTabId.value))
  const closableTabs = computed(() => tabs.value.filter((tab) => tab.closable))
  const hasMultipleTabs = computed(() => tabs.value.length > 1)
  // Actions
  function addTab(tab: Omit<Tab, 'id'> & { id?: string }): string {
    const newId = tab.id || generateTabId()

    const newTab: Tab = {
      ...tab,
      id: newId,
      closable: tab.closable ?? true
    }

    tabs.value.push(newTab)
    activeTabId.value = newId
    console.log(`[TabStore] Added new tab: ${newTab.title} (${newId})`)

    return newId
  }
  function removeTab(tabId: string): void {
    const tabIndex = tabs.value.findIndex((tab) => tab.id === tabId)
    if (tabIndex === -1) return

    const tabToRemove = tabs.value[tabIndex]
    if (!tabToRemove.closable) return

    // Prevent closing the last tab
    if (tabs.value.length <= 1) {
      console.log(`[TabStore] Cannot close last tab: ${tabToRemove.title}`)
      return
    }

    console.log(`[TabStore] Removing tab: ${tabToRemove.title} (${tabId})`)

    // Emit event after successful validation but before removal
    workspaceEvents.emit('tab:close', {
      tabId: tabToRemove.id,
      title: tabToRemove.title
    })

    tabs.value.splice(tabIndex, 1)

    // If we removed the active tab, switch to another tab
    if (activeTabId.value === tabId) {
      if (tabs.value.length > 0) {
        // Switch to the tab before the removed one, or the first tab if it was the first
        const newActiveIndex = Math.max(0, tabIndex - 1)
        activeTabId.value = tabs.value[newActiveIndex].id
        console.log(`[TabStore] Switched to tab: ${tabs.value[newActiveIndex].title}`)
      }
    }
  }

  function switchToTab(tabId: string): void {
    const tab = tabs.value.find((t) => t.id === tabId)
    if (tab) {
      activeTabId.value = tabId
    }
  }

  function updateTab(tabId: string, updates: Partial<Omit<Tab, 'id'>>): void {
    const tab = tabs.value.find((t) => t.id === tabId)
    if (tab) {
      Object.assign(tab, updates)
    }
  }

  function setTabDirty(tabId: string, isDirty: boolean): void {
    updateTab(tabId, { isDirty })
  }
  function closeAllClosableTabs(): void {
    const tabsToClose = tabs.value.filter((tab) => tab.closable)
    const closedCount = tabsToClose.length

    if (closedCount > 0) {
      // Emit event before closing tabs
      workspaceEvents.emit('tab:close-all', {
        closedCount
      })

      const tabsToCloseIds = tabsToClose.map((tab) => tab.id)
      tabsToCloseIds.forEach((tabId) => removeTab(tabId))
    }
  }

  function closeOtherTabs(exceptTabId: string): void {
    const tabsToClose = tabs.value.filter((t) => t.id !== exceptTabId && t.closable)
    const closedCount = tabsToClose.length

    if (closedCount > 0) {
      // Emit event before closing tabs
      workspaceEvents.emit('tab:close-others', {
        exceptTabId,
        closedCount
      })

      const tabsToCloseIds = tabsToClose.map((tab) => tab.id)
      tabsToCloseIds.forEach((tabId) => removeTab(tabId))
    }
  }

  function reloadTab(tabId: string): void {
    const tab = tabs.value.find((t) => t.id === tabId)
    if (!tab) return

    // Emit event for tab reload
    workspaceEvents.emit('tab:reload', {
      tabId: tab.id,
      title: tab.title
    })

    // Clear tab state to force re-initialization
    if (tab.state) {
      tab.state = {}
    }

    // Switch to the tab to trigger re-render
    switchToTab(tabId)
  }

  // Tab state management functions
  function getTabState(tabId: string, key?: string): any {
    const tab = tabs.value.find((t) => t.id === tabId)
    if (!tab || !tab.state) return undefined

    return key ? tab.state[key] : tab.state
  }

  function setTabState(tabId: string, key: string, value: any): void {
    const tab = tabs.value.find((t) => t.id === tabId)
    if (!tab) return

    if (!tab.state) {
      tab.state = {}
    }

    tab.state[key] = value
    tab.lastAccessed = Date.now()
    console.log(`[TabStore] Set state for tab ${tab.title}: ${key} = ${JSON.stringify(value)}`)
  }

  function updateTabState(tabId: string, stateUpdates: Record<string, any>): void {
    const tab = tabs.value.find((t) => t.id === tabId)
    if (!tab) return

    if (!tab.state) {
      tab.state = {}
    }

    Object.assign(tab.state, stateUpdates)
    tab.lastAccessed = Date.now()
    console.log(`[TabStore] Updated state for tab ${tab.title}:`, stateUpdates)
  }
  function clearTabState(tabId: string, key?: string): void {
    const tab = tabs.value.find((t) => t.id === tabId)
    if (!tab || !tab.state) return

    if (key) {
      delete tab.state[key]
    } else {
      tab.state = {}
    }

    console.log(`[TabStore] Cleared state for tab ${tab.title}${key ? ` (key: ${key})` : ''}`)
  }
  function duplicateTab(tabId: string): string | null {
    const tab = tabs.value.find((t) => t.id === tabId)
    if (!tab) return null

    const newTabId = addTab({
      title: tab.title,
      route: { ...tab.route },
      closable: true,
      state: tab.state ? { ...tab.state } : undefined
    })

    // Emit event after successful duplication
    workspaceEvents.emit('tab:duplicate', {
      tabId: tab.id,
      title: tab.title
    })

    return newTabId
  }

  // Helper function to generate unique tab IDs
  function generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  // Tab creation helpers for common routes
  function openLibraryTab(): string {
    return addTab({
      title: 'Library',
      route: { name: RouteNames.LIBRARY },
      closable: true
    })
  }

  function openCommunityTab(): string {
    return addTab({
      title: 'Community',
      route: { name: RouteNames.COMMUNITY },
      closable: true
    })
  }

  function openMediaPlayerTab(mediaId?: string, title?: string): string {
    return addTab({
      title: title || 'Media Player',
      route: {
        name: RouteNames.MEDIA_PLAYER,
        params: mediaId ? { id: mediaId } : undefined
      },
      closable: true
    })
  }
  function openSettingsTab(): string {
    return addTab({
      title: 'Settings',
      route: { name: RouteNames.SETTINGS },
      closable: true
    })
  }

  return {
    // State
    tabs,
    activeTabId,

    // Getters
    activeTab,
    closableTabs,
    hasMultipleTabs, // Actions
    addTab,
    removeTab,
    switchToTab,
    updateTab,
    setTabDirty,
    closeAllClosableTabs,
    closeOtherTabs,
    reloadTab,
    duplicateTab,

    // Helpers
    openLibraryTab,
    openCommunityTab,
    openMediaPlayerTab,
    openSettingsTab,

    // Tab state management
    getTabState,
    setTabState,
    updateTabState,
    clearTabState
  }
})
