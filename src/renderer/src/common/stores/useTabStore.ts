import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { RouteNames } from '@renderer/common/router/routes'
import { workspaceService} from '@renderer/core/services/workspace/workspace-service'

export interface Tab {
  id: string
  title: string
  route: {
    name: string
    params?: Record<string, any>
    query?: Record<string, any>
  }
  closable: boolean
  isDirty?: boolean
  state?: Record<string, any>
  lastAccessed?: number
}

export const useTabStore = defineStore('tabs', () => {
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

  const activeTab = computed(() => tabs.value.find((tab) => tab.id === activeTabId.value))
  const closableTabs = computed(() => tabs.value.filter((tab) => tab.closable))
  const hasMultipleTabs = computed(() => tabs.value.length > 1)

  function addTab(tab: Omit<Tab, 'id'> & { id?: string }): string {
    const newId = tab.id || generateTabId()

    const newTab: Tab = {
      ...tab,
      id: newId,
      closable: tab.closable ?? true
    }

    tabs.value.push(newTab)
    activeTabId.value = newId

    return newId
  }
  function removeTab(tabId: string): void {
    const tabIndex = tabs.value.findIndex((tab) => tab.id === tabId)
    if (tabIndex === -1) return

    const tabToRemove = tabs.value[tabIndex]
    if (!tabToRemove.closable) return

    // Prevent closing the last tab
    if (tabs.value.length <= 1) return

    workspaceService.emit('tab:close', {
      tabId: tabToRemove.id,
      title: tabToRemove.title
    })

    tabs.value.splice(tabIndex, 1)

    // Switch to another tab if we removed the active one
    if (activeTabId.value === tabId) {
      if (tabs.value.length > 0) {
        const newActiveIndex = Math.max(0, tabIndex - 1)
        activeTabId.value = tabs.value[newActiveIndex].id
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
      workspaceService.emit('tab:close-all', { closedCount })
      const tabsToCloseIds = tabsToClose.map((tab) => tab.id)
      tabsToCloseIds.forEach((tabId) => removeTab(tabId))
    }
  }

  function closeOtherTabs(exceptTabId: string): void {
    const tabsToClose = tabs.value.filter((t) => t.id !== exceptTabId && t.closable)
    const closedCount = tabsToClose.length

    if (closedCount > 0) {
      workspaceService.emit('tab:close-others', { exceptTabId, closedCount })
      const tabsToCloseIds = tabsToClose.map((tab) => tab.id)
      tabsToCloseIds.forEach((tabId) => removeTab(tabId))
    }
  }
  function reloadTab(tabId: string): void {
    const tab = tabs.value.find((t) => t.id === tabId)
    if (!tab) return

    workspaceService.emit('tab:reload', {
      tabId: tab.id,
      title: tab.title
    })

    // Clear tab state to force re-initialization
    if (tab.state) {
      tab.state = {}
    }

    switchToTab(tabId)
  }
  // Tab state management
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
  }

  function updateTabState(tabId: string, stateUpdates: Record<string, any>): void {
    const tab = tabs.value.find((t) => t.id === tabId)
    if (!tab) return

    if (!tab.state) {
      tab.state = {}
    }

    Object.assign(tab.state, stateUpdates)
    tab.lastAccessed = Date.now()
  }
  function clearTabState(tabId: string, key?: string): void {
    const tab = tabs.value.find((t) => t.id === tabId)
    if (!tab || !tab.state) return

    if (key) {
      delete tab.state[key]
    } else {
      tab.state = {}
    }
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

    workspaceService.emit('tab:duplicate', {
      tabId: tab.id,
      title: tab.title
    })

    return newTabId
  }
  function generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Find existing tab by route name and parameters
  function findTabByRoute(routeName: string, params?: Record<string, any>): Tab | undefined {
    return tabs.value.find((tab) => {
      if (tab.route.name !== routeName) return false

      // If no params to match, just check route name
      if (!params && !tab.route.params) return true
      if (!params || !tab.route.params) return false

      // Check if all required params match
      return Object.keys(params).every(
        (key) => tab.route.params && tab.route.params[key] === params[key]
      )
    })
  }

  // Navigate active tab to new route or create new tab if forceNew is true
  function navigateActiveTabOrCreateNew(
    tabConfig: Omit<Tab, 'id'> & { id?: string },
    forceNew: boolean = false
  ): string {
    if (forceNew) {
      return addTab(tabConfig)
    }

    // Change the active tab's route
    const currentTab = activeTab.value
    if (currentTab) {
      updateTab(currentTab.id, {
        title: tabConfig.title,
        route: tabConfig.route
      })
      return currentTab.id
    } else {
      return addTab(tabConfig)
    }
  }
  // Tab creation helpers
  function openLibraryTab(forceNew: boolean = false): string {
    return navigateActiveTabOrCreateNew(
      {
        title: 'Library',
        route: { name: RouteNames.LIBRARY },
        closable: true
      },
      forceNew
    )
  }

  function openCommunityTab(forceNew: boolean = false): string {
    return navigateActiveTabOrCreateNew(
      {
        title: 'Community',
        route: { name: RouteNames.COMMUNITY },
        closable: true
      },
      forceNew
    )
  }

  function openMediaPlayerTab(mediaId?: string, title?: string, forceNew: boolean = false): string {
    return navigateActiveTabOrCreateNew(
      {
        title: title || 'Media Player',
        route: {
          name: RouteNames.MEDIA_PLAYER,
          params: mediaId ? { id: mediaId } : undefined
        },
        closable: true
      },
      forceNew
    )
  }

  function openSettingsTab(forceNew: boolean = false): string {
    return navigateActiveTabOrCreateNew(
      {
        title: 'Settings',
        route: { name: RouteNames.SETTINGS },
        closable: true
      },
      forceNew
    )
  }
  return {
    tabs,
    activeTabId,
    activeTab,
    closableTabs,
    hasMultipleTabs,
    addTab,
    removeTab,
    switchToTab,
    updateTab,
    setTabDirty,
    closeAllClosableTabs,
    closeOtherTabs,
    reloadTab,
    duplicateTab,
    findTabByRoute,
    navigateActiveTabOrCreateNew,
    openLibraryTab,
    openCommunityTab,
    openMediaPlayerTab,
    openSettingsTab,
    getTabState,
    setTabState,
    updateTabState,
    clearTabState
  }
})
