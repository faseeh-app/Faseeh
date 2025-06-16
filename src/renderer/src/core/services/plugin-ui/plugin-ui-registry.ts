import { ref, reactive } from 'vue'
import { EventBusService } from '@renderer/core/services/event-bus/event-bus-service'
import type { PluginUIViewConfig, RegisteredPluginView, PluginUIEvents } from '@shared/types/types'

/**
 * Service for managing plugin UI registrations and state
 * Similar to Obsidian's workspace API for plugins
 */
export class PluginUIRegistry extends EventBusService<PluginUIEvents> {
  private registeredViews = reactive(new Map<string, RegisteredPluginView>())
  private activeView = ref<RegisteredPluginView | null>(null)
  private viewsByPlugin = reactive(new Map<string, Set<string>>())

  constructor() {
    super('ui')
  } /**
   * Register a new UI view for a plugin
   */
  registerView(pluginId: string, config: PluginUIViewConfig): string {
    const viewKey = `${pluginId}:${config.id}`
    console.log(`🎨 [Plugin UI Registry] Registering view: ${viewKey}`, config)

    if (this.registeredViews.has(viewKey)) {
      throw new Error(`View ${config.id} already registered for plugin ${pluginId}`)
    } // Validate that onMount is provided for DOM-based views
    if (!config.onMount) {
      throw new Error(`View ${config.id} must provide an 'onMount' callback`)
    }
    const registeredView: RegisteredPluginView = {
      ...config,
      pluginId,
      isActive: false
    }

    this.registeredViews.set(viewKey, registeredView)
    console.log(
      `🎨 [Plugin UI Registry] View registered: ${viewKey}. Total views: ${this.registeredViews.size}`
    )

    // Track views by plugin
    if (!this.viewsByPlugin.has(pluginId)) {
      this.viewsByPlugin.set(pluginId, new Set())
    }
    this.viewsByPlugin.get(pluginId)!.add(viewKey)

    // If this is marked as default and no view is currently active, activate it
    if (config.isDefault && !this.activeView.value) {
      console.log(`🎨 [Plugin UI Registry] Activating default view: ${viewKey}`)
      this.activateView(viewKey)
    }

    this.emit('ui:registered', {
      pluginId,
      viewId: config.id,
      label: config.label
    })

    return viewKey
  }

  /**
   * Unregister a UI view
   */
  unregisterView(pluginId: string, viewId: string): boolean {
    const viewKey = `${pluginId}:${viewId}`
    const view = this.registeredViews.get(viewKey)

    if (!view) {
      return false
    }

    // If this view is currently active, deactivate it
    if (this.activeView.value?.pluginId === pluginId && this.activeView.value?.id === viewId) {
      this.deactivateCurrentView()
    }

    this.registeredViews.delete(viewKey)
    this.viewsByPlugin.get(pluginId)?.delete(viewKey)

    this.emit('ui:unregistered', {
      pluginId,
      viewId
    })

    return true
  }

  /**
   * Unregister all views for a plugin (called when plugin is unloaded)
   */
  unregisterPluginViews(pluginId: string): number {
    const pluginViews = this.viewsByPlugin.get(pluginId)
    if (!pluginViews) {
      return 0
    }

    let unregisteredCount = 0
    for (const viewKey of pluginViews) {
      const view = this.registeredViews.get(viewKey)
      if (view) {
        if (this.activeView.value === view) {
          this.deactivateCurrentView()
        }
        this.registeredViews.delete(viewKey)
        unregisteredCount++

        this.emit('ui:unregistered', {
          pluginId,
          viewId: view.id
        })
      }
    }

    this.viewsByPlugin.delete(pluginId)
    return unregisteredCount
  }
  /**
   * Activate a specific view by key
   */
  activateView(viewKey: string): boolean {
    console.log(`🎨 [Plugin UI Registry] Attempting to activate view: ${viewKey}`)
    const view = this.registeredViews.get(viewKey)
    if (!view) {
      console.warn(`🎨 [Plugin UI Registry] View not found: ${viewKey}`)
      return false
    }

    // Deactivate current view if any
    if (this.activeView.value) {
      console.log(
        `🎨 [Plugin UI Registry] Deactivating current view: ${this.activeView.value.pluginId}:${this.activeView.value.id}`
      )
      this.deactivateCurrentView()
    }

    // Activate the new view
    view.isActive = true
    view.lastActivated = new Date()
    this.activeView.value = view

    console.log(`🎨 [Plugin UI Registry] View activated: ${viewKey}`, view)

    this.emit('ui:activated', {
      pluginId: view.pluginId,
      viewId: view.id
    })

    return true
  }

  /**
   * Activate a view by plugin ID and view ID
   */
  activateViewById(pluginId: string, viewId: string): boolean {
    const viewKey = `${pluginId}:${viewId}`
    return this.activateView(viewKey)
  }

  /**
   * Deactivate the currently active view
   */
  deactivateCurrentView(): boolean {
    if (!this.activeView.value) {
      return false
    }

    const currentView = this.activeView.value
    currentView.isActive = false

    this.emit('ui:deactivated', {
      pluginId: currentView.pluginId,
      viewId: currentView.id
    })

    this.activeView.value = null
    return true
  }

  /**
   * Get the currently active view
   */
  getActiveView(): RegisteredPluginView | null {
    return this.activeView.value
  }

  /**
   * Get all registered views
   */
  getAllViews(): RegisteredPluginView[] {
    return Array.from(this.registeredViews.values())
  }

  /**
   * Get all views for a specific plugin
   */
  getPluginViews(pluginId: string): RegisteredPluginView[] {
    const pluginViewKeys = this.viewsByPlugin.get(pluginId)
    if (!pluginViewKeys) {
      return []
    }

    return Array.from(pluginViewKeys)
      .map((key) => this.registeredViews.get(key))
      .filter((view): view is RegisteredPluginView => view !== undefined)
  }

  /**
   * Get a specific view
   */
  getView(pluginId: string, viewId: string): RegisteredPluginView | null {
    const viewKey = `${pluginId}:${viewId}`
    return this.registeredViews.get(viewKey) || null
  }

  /**
   * Update view configuration
   */
  updateView(pluginId: string, viewId: string, updates: Partial<PluginUIViewConfig>): boolean {
    const viewKey = `${pluginId}:${viewId}`
    const view = this.registeredViews.get(viewKey)

    if (!view) {
      return false
    }

    // Apply updates
    Object.assign(view, updates)
    return true
  }

  /**
   * Check if a view is registered
   */
  hasView(pluginId: string, viewId: string): boolean {
    const viewKey = `${pluginId}:${viewId}`
    return this.registeredViews.has(viewKey)
  }

  /**
   * Get the reactive active view ref for components to watch
   */
  getActiveViewRef() {
    return this.activeView
  }

  /**
   * Get the reactive views map for components to watch
   */
  getViewsRef() {
    return this.registeredViews
  }

  /**
   * Report an error for a specific view
   */
  reportViewError(pluginId: string, viewId: string, error: string): void {
    this.emit('ui:error', {
      pluginId,
      viewId,
      error
    })
  } /**
   * Clean up all resources
   */
  destroy(): void {
    this.deactivateCurrentView()
    this.registeredViews.clear()
    this.viewsByPlugin.clear()
  }
}
