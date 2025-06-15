import { Router, RouteLocationNormalized, useRouter, useRoute } from 'vue-router'
import { watch } from 'vue'
import { useTabStore } from '@renderer/core/stores/useTabStore'

/**
 * Configuration object for route navigation.
 *
 * @interface RouteConfig
 * @property {string} name - The name of the route to navigate to
 * @property {Record<string, any>} [params] - Route parameters
 * @property {Record<string, any>} [query] - Query parameters
 *
 * @example
 * ```typescript
 * const routeConfig: RouteConfig = {
 *   name: 'document-viewer',
 *   params: { id: '123' },
 *   query: { highlight: 'true' }
 * }
 * ```
 */
export interface RouteConfig {
  name: string
  params?: Record<string, any>
  query?: Record<string, any>
}

/**
 * Options for controlling tab router navigation behavior.
 *
 * @interface TabRouterNavigationOptions
 * @property {string} [title] - Custom title for the tab (defaults to route-based title)
 * @property {boolean} [newTab=false] - Whether to open the route in a new tab
 * @property {boolean} [replace=false] - Whether to replace the current history entry
 *
 * @example
 * ```typescript
 * const options: TabRouterNavigationOptions = {
 *   title: 'My Document',
 *   newTab: true,
 *   replace: false
 * }
 * ```
 */
export interface TabRouterNavigationOptions {
  title?: string
  newTab?: boolean
  replace?: boolean
}

/**
 * Tab-aware router that integrates with the tab system.
 *
 * Provides enhanced navigation methods that work with tabs, supporting features
 * like tab history, new tab creation, and tab state management.
 *
 * @example
 * ```typescript
 * const tabRouter = new TabRouter(vueRouter)
 *
 * // Navigate to a route in the current tab
 * await tabRouter.push({ name: 'library' }, { title: 'My Library' })
 *
 * // Open a route in a new tab
 * await tabRouter.push(
 *   { name: 'document-viewer', params: { id: '123' } },
 *   { title: 'Document 123', newTab: true }
 * )
 *
 * // Go back in tab history
 * const didGoBack = await tabRouter.back()
 * ```
 */
export class TabRouter {
  /**
   * The underlying Vue Router instance.
   * @private
   * @type {Router}
   */
  private vueRouter: Router

  /**
   * The tab store instance for managing tab state.
   * @private
   * @type {ReturnType<typeof useTabStore>}
   */
  private tabStore: ReturnType<typeof useTabStore>

  /**
   * Creates a new TabRouter instance.
   *
   * @constructor
   * @param {Router} vueRouter - The Vue Router instance to use for navigation
   *
   * @example
   * ```typescript
   * import { createRouter } from 'vue-router'
   * const router = createRouter(...)
   * const tabRouter = new TabRouter(router)
   * ```
   */
  constructor(vueRouter: Router) {
    this.vueRouter = vueRouter
    this.tabStore = useTabStore()

    // Initialize with a default tab if none exist
    this.ensureActiveTab()
  }

  /**
   * Ensures there's always an active tab, creating one if necessary.
   * @private
   */
  private ensureActiveTab(): void {
    if (this.tabStore.tabs.length === 0) {
      const tabId = this.tabStore.addTab({
        title: 'Library',
        route: { name: 'library' },
        closable: true,
        history: []
      })
      this.tabStore.activeTabId = tabId
    }
  }
  /**
   * Navigate to a route, optionally in a new tab.
   *
   * This is the primary navigation method that supports both same-tab and new-tab navigation.
   * It automatically manages tab state, history, and route synchronization.
   *
   * @async
   * @method push
   * @param {RouteConfig} to - The route configuration to navigate to
   * @param {TabRouterNavigationOptions} [options={}] - Navigation options
   * @returns {Promise<string>} The ID of the tab that was navigated to
   *
   * @example
   * ```typescript
   * // Navigate in current tab
   * const tabId = await tabRouter.push(
   *   { name: 'library' },
   *   { title: 'Library' }
   * )
   *
   * // Open in new tab
   * const newTabId = await tabRouter.push(
   *   { name: 'document-viewer', params: { id: '123' } },
   *   { title: 'Document 123', newTab: true }
   * )
   *
   * // Replace current route (no history entry)
   * const tabId = await tabRouter.push(
   *   { name: 'updated-route' },
   *   { title: 'Updated', replace: true }
   * )
   * ```
   */ async push(to: RouteConfig, options: TabRouterNavigationOptions = {}): Promise<string> {
    const { title, newTab = false, replace = false } = options

    if (newTab) {
      // Create a new tab and navigate
      const tabId = this.tabStore.addTab({
        title: title || 'New Tab',
        route: to,
        closable: true,
        history: []
      })

      await this.vueRouter.push(to)
      return tabId
    } else {
      // Ensure we have an active tab
      this.ensureActiveTab()
      // Add current route to history before navigating (if not replacing)
      if (!replace) {
        this.addCurrentRouteToHistory()
      }

      // Navigate in current tab
      if (replace) {
        await this.vueRouter.replace(to)
      } else {
        await this.vueRouter.push(to)
      }

      // Update current tab
      this.tabStore.updateActiveTabRoute(to, title)
      return this.tabStore.activeTabId || ''
    }
  }
  /**
   * Adds the current route to the active tab's history.
   * @private
   */
  private addCurrentRouteToHistory(): void {
    const activeTab = this.tabStore.activeTab
    if (activeTab) {
      if (!activeTab.history) activeTab.history = []

      // Only add to history if it's a different route
      const currentRoute = this.currentRoute
      if (currentRoute.name && activeTab.route.name !== currentRoute.name) {
        activeTab.history.push({
          name: activeTab.route.name,
          params: activeTab.route.params,
          query: activeTab.route.query,
          title: activeTab.title
        })
      }
    }
  }
  /**
   * Go back in the current tab's navigation history.
   *
   * Attempts to navigate to the previous route in the current tab's history.
   * If there's no history or navigation fails, returns false.
   *
   * @async
   * @method back
   * @returns {Promise<boolean>} True if navigation was successful, false otherwise
   *
   * @example
   * ```typescript
   * const didGoBack = await tabRouter.back()
   * if (!didGoBack) {
   *   // Handle case where there's no history to go back to
   *   console.log('No history to go back to')
   * }
   *
   * // Common pattern: go back or fallback to a default route
   * const success = await tabRouter.back()
   * if (!success) {
   *   await tabRouter.push({ name: 'library' }, { title: 'Library' })
   * }
   * ```
   */ async back(): Promise<boolean> {
    const activeTab = this.tabStore.activeTab
    if (!activeTab || !activeTab.history || activeTab.history.length === 0) {
      return false
    }

    const previousRoute = activeTab.history.pop()
    if (previousRoute) {
      // Update tab route
      this.tabStore.updateTabRoute(
        activeTab.id,
        {
          name: previousRoute.name,
          params: previousRoute.params,
          query: previousRoute.query
        },
        previousRoute.title
      )

      // Navigate to the previous route
      await this.vueRouter.push({
        name: previousRoute.name,
        params: previousRoute.params,
        query: previousRoute.query
      })

      return true
    }

    return false
  }
  /**
   * Replace the current route without adding to history.
   *
   * This is a convenience method that calls push() with the replace option set to true.
   * Useful when you want to update the current route without creating a history entry.
   *
   * @async
   * @method replace
   * @param {RouteConfig} to - The route configuration to navigate to
   * @param {TabRouterNavigationOptions} [options={}] - Navigation options (replace will be set to true)
   * @returns {Promise<string>} The ID of the tab that was navigated to
   *
   * @example
   * ```typescript
   * // Replace current route with a new one
   * const tabId = await tabRouter.replace(
   *   { name: 'updated-view', params: { id: 'new-id' } },
   *   { title: 'Updated View' }
   * )
   * ```
   */
  async replace(to: RouteConfig, options: TabRouterNavigationOptions = {}): Promise<string> {
    return this.push(to, { ...options, replace: true })
  }
  /**
   * Open a route in a new tab (convenience method).
   *
   * This is a shorthand for calling push() with newTab: true.
   * Useful for quickly opening routes in new tabs.
   *
   * @async
   * @method openInNewTab
   * @param {RouteConfig} to - The route configuration to navigate to
   * @param {string} [title] - Optional title for the new tab
   * @returns {Promise<string>} The ID of the newly created tab
   *
   * @example
   * ```typescript
   * // Open a document in a new tab
   * const newTabId = await tabRouter.openInNewTab(
   *   { name: 'document-viewer', params: { id: '123' } },
   *   'Document 123'
   * )
   *
   * // Open without custom title (will use default)
   * const tabId = await tabRouter.openInNewTab({ name: 'community' })
   * ```
   */
  async openInNewTab(to: RouteConfig, title?: string): Promise<string> {
    return this.push(to, { title, newTab: true })
  }
  /**
   * Get the current route information.
   *
   * Provides access to the current Vue Router route object, which contains
   * information about the current location, parameters, query strings, etc.
   *
   * @readonly
   * @type {RouteLocationNormalized}
   *
   * @example
   * ```typescript
   * const currentRoute = tabRouter.currentRoute
   * console.log('Current route name:', currentRoute.name)
   * console.log('Route params:', currentRoute.params)
   * console.log('Query params:', currentRoute.query)
   * ```
   */
  get currentRoute(): RouteLocationNormalized {
    return this.vueRouter.currentRoute.value
  }
  /**
   * Check if the current tab can go back in its history.
   *
   * Returns true if the current tab has navigation history that can be used
   * with the back() method.
   *
   * @readonly
   * @type {boolean}
   *
   * @example
   * ```typescript
   * if (tabRouter.canGoBack) {
   *   // Show back button or enable back functionality
   *   await tabRouter.back()
   * } else {
   *   // Disable back button or provide alternative navigation
   *   console.log('No history to go back to')
   * }
   * ```
   */ get canGoBack(): boolean {
    const activeTab = this.tabStore.activeTab
    return activeTab?.history ? activeTab.history.length > 0 : false
  }
  /**
   * Close the currently active tab.
   *
   * Closes the current tab if it's closable. If this is the last tab,
   * the operation may be prevented depending on tab store configuration.
   *
   * @method closeCurrentTab
   * @returns {void}
   *
   * @example
   * ```typescript
   * // Close current tab (e.g., when user clicks close button)
   * tabRouter.closeCurrentTab()
   * ```
   */
  closeCurrentTab(): void {
    const activeTab = this.tabStore.activeTab
    if (activeTab) {
      this.tabStore.removeTab(activeTab.id)
    }
  }
  /**
   * Close all tabs except the currently active one.
   *
   * Closes all other tabs while keeping the current tab open.
   * Only closable tabs will be closed.
   *
   * @method closeOtherTabs
   * @returns {void}
   *
   * @example
   * ```typescript
   * // Close all other tabs (useful for "Close Others" context menu)
   * tabRouter.closeOtherTabs()
   * ```
   */
  closeOtherTabs(): void {
    const activeTab = this.tabStore.activeTab
    if (activeTab) {
      this.tabStore.closeOtherTabs(activeTab.id)
    }
  }
  /**
   * Create a duplicate of the currently active tab.
   *
   * Creates a new tab with the same route and state as the current tab.
   * The new tab will be activated after creation.
   *
   * @method duplicateCurrentTab
   * @returns {string | null} The ID of the newly created tab, or null if duplication failed
   *
   * @example
   * ```typescript
   * const duplicatedTabId = tabRouter.duplicateCurrentTab()
   * if (duplicatedTabId) {
   *   console.log('Tab duplicated with ID:', duplicatedTabId)
   * } else {
   *   console.log('Failed to duplicate tab')
   * }
   * ```
   */
  duplicateCurrentTab(): string | null {
    const activeTab = this.tabStore.activeTab
    if (activeTab) {
      return this.tabStore.duplicateTab(activeTab.id)
    }
    return null
  }
  /**
   * Switch to a specific tab by its ID.
   *
   * Activates the tab with the given ID and navigates to its current route.
   * The route will be automatically synchronized when the tab becomes active.
   *
   * @method switchToTab
   * @param {string} tabId - The ID of the tab to switch to
   * @returns {void}
   *
   * @example
   * ```typescript
   * // Switch to a specific tab (e.g., when user clicks on tab)
   * tabRouter.switchToTab('tab_123456_abc')
   * ```
   */
  switchToTab(tabId: string): void {
    this.tabStore.switchToTab(tabId)
  }
  /**
   * Get access to the underlying Vue Router instance.
   *
   * Provides direct access to the Vue Router instance for advanced operations
   * that are not covered by the TabRouter API.
   *
   * @readonly
   * @type {Router}
   *
   * @example
   * ```typescript
   * // Access Vue Router directly for advanced operations
   * const vueRouter = tabRouter.router
   * await vueRouter.isReady()
   *
   * // Use router guards or other Vue Router features
   * vueRouter.beforeEach((to, from, next) => {
   *   // Custom navigation guard logic
   *   next()
   * })
   * ```
   */
  get router(): Router {
    return this.vueRouter
  }
  /**
   * Get access to the tab store instance.
   *
   * Provides direct access to the tab store for advanced tab management
   * operations that are not covered by the TabRouter API.
   *
   * @readonly
   * @type {ReturnType<typeof useTabStore>}
   *
   * @example
   * ```typescript
   * // Access tab store directly for advanced operations
   * const tabStore = tabRouter.tabs
   * const allTabs = tabStore.tabs
   * const activeTab = tabStore.activeTab
   *
   * // Set custom tab state
   * tabStore.setTabState('tab_123', 'customData', { foo: 'bar' })
   * ```
   */
  get tabs() {
    return this.tabStore
  }
}

/**
 * Vue composable for using the TabRouter with automatic route synchronization.
 *
 * Creates a TabRouter instance and sets up automatic route watching
 * to keep tabs synchronized with Vue Router navigation.
 *
 * @function useTabRouter
 * @returns {TabRouter} A configured TabRouter instance with route synchronization
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useTabRouter } from '@renderer/common/services/tabRouter'
 *
 * const tabRouter = useTabRouter()
 *
 * // Navigate to a route
 * const handleNavigation = async () => {
 *   await tabRouter.push({ name: 'library' }, { title: 'Library' })
 * }
 *
 * // Open in new tab with Ctrl+Click detection
 * const handleCardClick = async (event: MouseEvent) => {
 *   const newTab = event.ctrlKey || event.metaKey
 *   await tabRouter.push(
 *     { name: 'document-viewer', params: { id: '123' } },
 *     { title: 'Document', newTab }
 *   )
 * }
 * </script>
 * ```
 */
export function useTabRouter(): TabRouter {
  const router = useRouter()
  const route = useRoute()
  const tabStore = useTabStore()
  const tabRouter = new TabRouter(router)
  // Set up route watching to sync with tabs
  watch(
    () => route.fullPath,
    () => {
      // Only update if there's an active tab and the route has a name
      if (route.name && tabStore.activeTab) {
        tabStore.updateActiveTabRoute({
          name: route.name as string,
          params: route.params,
          query: route.query
        })
      }
    },
    { immediate: true } // Run immediately to capture the initial route
  )

  return tabRouter
}

/**
 * Factory function for creating a TabRouter instance with a given Vue Router.
 *
 * This factory function is useful when you need to create a TabRouter instance
 * outside of a Vue component context, such as in main.ts or in service files
 * where you have direct access to the router instance.
 *
 * @function createTabRouter
 * @param {Router} vueRouter - The Vue Router instance to use
 * @returns {TabRouter} A new TabRouter instance
 *
 * @example
 * ```typescript
 * // In main.ts or a service file
 * import { createRouter } from 'vue-router'
 * import { createTabRouter } from '@renderer/common/services/tabRouter'
 *
 * const router = createRouter({
 *   // router configuration
 * })
 *
 * const tabRouter = createTabRouter(router)
 *
 * // Use in application initialization
 * await tabRouter.push({ name: 'library' }, { title: 'Library' })
 * ```
 */
export function createTabRouter(vueRouter: Router): TabRouter {
  return new TabRouter(vueRouter)
}
