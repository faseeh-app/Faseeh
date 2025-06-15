/**
 * @fileoverview Tab state management store using Pinia.
 *
 * This store manages the state of all tabs in the application, including their routes,
 * properties, and lifecycle. It provides pure state management without any navigation logic.
 *
 * @internal
 * @author Faseeh Team
 * @since 1.0.0
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { workspaceService } from '@renderer/core/services/workspace/workspace-service'

/**
 * Represents a single tab in the application.
 *
 * @internal
 * @interface Tab
 * @property {string} id - Unique identifier for the tab
 * @property {string} title - Display title of the tab
 * @property {Object} route - Route configuration for the tab
 * @property {string} route.name - Name of the route
 * @property {Record<string, any>} [route.params] - Route parameters
 * @property {Record<string, any>} [route.query] - Query parameters
 * @property {boolean} closable - Whether the tab can be closed by the user
 * @property {boolean} [isDirty] - Whether the tab has unsaved changes
 * @property {Record<string, any>} [state] - Custom state data for the tab
 * @property {number} [lastAccessed] - Timestamp of last access
 * @property {Array} [history] - Navigation history for the tab
 */
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
  history?: Array<{
    name: string
    params?: Record<string, any>
    query?: Record<string, any>
    title: string
  }>
}

/**
 * Pinia store for managing tab state.
 *
 * This store handles all tab-related state management including creation, removal,
 * switching, and property updates. It does not handle navigation logic - that
 * responsibility belongs to the TabRouter service.
 *
 * @internal
 * @function useTabStore
 * @returns {Object} The tab store with all state and methods
 */
export const useTabStore = defineStore('tabs', () => {
  /**
   * Array of all tabs in the application.
   * @internal
   * @type {Ref<Tab[]>}
   */
  const tabs = ref<Tab[]>([])

  /**
   * ID of the currently active tab, or null if no tabs exist.
   * @internal
   * @type {Ref<string | null>}
   */
  const activeTabId = ref<string | null>(null)

  /**
   * The currently active tab object, or null if no tab is active.
   * @internal
   * @type {ComputedRef<Tab | null>}
   */
  const activeTab = computed(() =>
    activeTabId.value ? tabs.value.find((tab) => tab.id === activeTabId.value) : null
  )
  /**
   * Array of tabs that can be closed by the user.
   * @internal
   * @type {ComputedRef<Tab[]>}
   */
  const closableTabs = computed(() => tabs.value.filter((tab) => tab.closable))

  /**
   * Whether there are multiple tabs open (useful for UI decisions).
   * @internal
   * @type {ComputedRef<boolean>}
   */
  const hasMultipleTabs = computed(() => tabs.value.length > 1)

  /**
   * Creates a new tab and adds it to the store.
   *
   * The new tab will automatically become the active tab. If no ID is provided,
   * a unique ID will be generated automatically.
   *
   * @internal
   * @function addTab
   * @param {Omit<Tab, 'id'> & { id?: string }} tab - Tab configuration
   * @returns {string} The ID of the newly created tab
   */
  function addTab(tab: Omit<Tab, 'id'> & { id?: string }): string {
    const newId = tab.id || generateTabId()

    const newTab: Tab = {
      ...tab,
      id: newId,
      closable: tab.closable ?? true,
      history: tab.history || []
    }

    tabs.value.push(newTab)
    activeTabId.value = newId

    return newId
  }
  /**
   * Removes a tab from the store.
   *
   * Will not remove non-closable tabs or the last remaining tab. If the active tab
   * is removed, automatically switches to an adjacent tab. Emits a workspace event
   * when a tab is successfully closed.
   *
   * @internal
   * @function removeTab
   * @param {string} tabId - The ID of the tab to remove
   * @returns {void}
   */
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
  /**
   * Switches the active tab to the specified tab ID.
   *
   * Updates the lastAccessed timestamp for the tab being switched to.
   * Does nothing if the tab ID doesn't exist.
   *
   * @internal
   * @function switchToTab
   * @param {string} tabId - The ID of the tab to switch to
   * @returns {void}
   */
  function switchToTab(tabId: string): void {
    const tab = tabs.value.find((t) => t.id === tabId)
    if (tab) {
      activeTabId.value = tabId
      tab.lastAccessed = Date.now()
    }
  }

  /**
   * Updates properties of a specific tab.
   *
   * Allows partial updates to any tab property except the ID. Automatically
   * updates the lastAccessed timestamp.
   *
   * @internal
   * @function updateTab
   * @param {string} tabId - The ID of the tab to update
   * @param {Partial<Omit<Tab, 'id'>>} updates - Object containing the properties to update
   * @returns {void}
   */
  function updateTab(tabId: string, updates: Partial<Omit<Tab, 'id'>>): void {
    const tab = tabs.value.find((t) => t.id === tabId)
    if (tab) {
      Object.assign(tab, updates)
      tab.lastAccessed = Date.now()
    }
  }

  /**
   * Updates the route of the currently active tab.
   *
   * This method only updates the route and title without managing navigation history.
   * History management is handled by the TabRouter service.
   *
   * @internal
   * @function updateActiveTabRoute
   * @param {Object} route - The new route configuration
   * @param {string} route.name - Route name
   * @param {Record<string, any>} [route.params] - Route parameters
   * @param {Record<string, any>} [route.query] - Query parameters
   * @param {string} [title] - Optional new title for the tab
   * @returns {void}
   */
  function updateActiveTabRoute(
    route: {
      name: string
      params?: Record<string, any>
      query?: Record<string, any>
    },
    title?: string
  ): void {
    const tab = activeTab.value
    if (tab) {
      tab.route = route
      if (title) tab.title = title
      tab.lastAccessed = Date.now()
    }
  }

  /**
   * Updates the route of a specific tab by ID.
   *
   * Similar to updateActiveTabRoute but works on any tab, not just the active one.
   * Useful for updating tab routes without switching to them first.
   *
   * @internal
   * @function updateTabRoute
   * @param {string} tabId - The ID of the tab to update
   * @param {Object} route - The new route configuration
   * @param {string} route.name - Route name
   * @param {Record<string, any>} [route.params] - Route parameters
   * @param {Record<string, any>} [route.query] - Query parameters
   * @param {string} [title] - Optional new title for the tab
   * @returns {void}
   */
  function updateTabRoute(
    tabId: string,
    route: {
      name: string
      params?: Record<string, any>
      query?: Record<string, any>
    },
    title?: string
  ): void {
    const tab = tabs.value.find((t) => t.id === tabId)
    if (tab) {
      tab.route = route
      if (title) tab.title = title
      tab.lastAccessed = Date.now()
    }
  }

  /**
   * Marks a tab as dirty or clean.
   *
   * Convenience method for updating the isDirty property of a tab.
   * Useful for indicating unsaved changes in the UI.
   *
   * @internal
   * @function setTabDirty
   * @param {string} tabId - The ID of the tab to update
   * @param {boolean} isDirty - Whether the tab has unsaved changes
   * @returns {void}
   */
  function setTabDirty(tabId: string, isDirty: boolean): void {
    updateTab(tabId, { isDirty })
  }
  /**
   * Closes all closable tabs.
   *
   * Removes all tabs that have closable set to true. Emits a workspace event
   * with the count of closed tabs. Non-closable tabs will remain open.
   *
   * @internal
   * @function closeAllClosableTabs
   * @returns {void}
   */
  function closeAllClosableTabs(): void {
    const tabsToClose = tabs.value.filter((tab) => tab.closable)
    const closedCount = tabsToClose.length

    if (closedCount > 0) {
      workspaceService.emit('tab:close-all', { closedCount })
      const tabsToCloseIds = tabsToClose.map((tab) => tab.id)
      tabsToCloseIds.forEach((tabId) => removeTab(tabId))
    }
  }

  /**
   * Closes all tabs except the specified one.
   *
   * @internal
   * @function closeOtherTabs
   * @param {string} exceptTabId - The ID of the tab to keep open
   * @returns {void}
   */
  function closeOtherTabs(exceptTabId: string): void {
    const tabsToClose = tabs.value.filter((t) => t.id !== exceptTabId && t.closable)
    const closedCount = tabsToClose.length

    if (closedCount > 0) {
      workspaceService.emit('tab:close-others', { exceptTabId, closedCount })
      const tabsToCloseIds = tabsToClose.map((tab) => tab.id)
      tabsToCloseIds.forEach((tabId) => removeTab(tabId))
    }
  }

  /**
   * Reloads a tab by clearing its state and switching to it.
   *
   * @internal
   * @function reloadTab
   * @param {string} tabId - The ID of the tab to reload
   * @returns {void}
   */
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

  /**
   * Gets state data from a specific tab.
   *
   * @internal
   * @function getTabState
   * @param {string} tabId - The ID of the tab
   * @param {string} [key] - Specific state key to retrieve
   * @returns {any} The state value or undefined if not found
   */
  function getTabState(tabId: string, key?: string): any {
    const tab = tabs.value.find((t) => t.id === tabId)
    if (!tab || !tab.state) return undefined

    return key ? tab.state[key] : tab.state
  }

  /**
   * Sets a state value for a specific tab.
   *
   * @internal
   * @function setTabState
   * @param {string} tabId - The ID of the tab
   * @param {string} key - The state key
   * @param {any} value - The value to set
   * @returns {void}
   */
  function setTabState(tabId: string, key: string, value: any): void {
    const tab = tabs.value.find((t) => t.id === tabId)
    if (!tab) return

    if (!tab.state) {
      tab.state = {}
    }

    tab.state[key] = value
    tab.lastAccessed = Date.now()
  }

  /**
   * Updates multiple state values for a specific tab.
   *
   * @internal
   * @function updateTabState
   * @param {string} tabId - The ID of the tab
   * @param {Record<string, any>} stateUpdates - Object containing state updates
   * @returns {void}
   */
  function updateTabState(tabId: string, stateUpdates: Record<string, any>): void {
    const tab = tabs.value.find((t) => t.id === tabId)
    if (!tab) return

    if (!tab.state) {
      tab.state = {}
    }

    Object.assign(tab.state, stateUpdates)
    tab.lastAccessed = Date.now()
  }

  /**
   * Clears state data for a specific tab.
   *
   * @internal
   * @function clearTabState
   * @param {string} tabId - The ID of the tab
   * @param {string} [key] - Specific state key to clear, or all state if omitted
   * @returns {void}
   */
  function clearTabState(tabId: string, key?: string): void {
    const tab = tabs.value.find((t) => t.id === tabId)
    if (!tab || !tab.state) return

    if (key) {
      delete tab.state[key]
    } else {
      tab.state = {}
    }
  }

  /**
   * Creates a duplicate of the specified tab.
   *
   * @internal
   * @function duplicateTab
   * @param {string} tabId - The ID of the tab to duplicate
   * @returns {string | null} The ID of the new tab, or null if duplication failed
   */
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

  /**
   * Generates a unique tab ID.
   *
   * @internal
   * @function generateTabId
   * @returns {string} A unique tab identifier
   */
  function generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
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
    updateActiveTabRoute,
    updateTabRoute,
    setTabDirty,
    closeAllClosableTabs,
    closeOtherTabs,
    reloadTab,
    duplicateTab,
    getTabState,
    setTabState,
    updateTabState,
    clearTabState
  }
})
