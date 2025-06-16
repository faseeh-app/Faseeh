import { ref, computed, watch } from 'vue'
import type {
  PluginUIRegistry,
  RegisteredPluginView
} from '@renderer/core/services/plugin-ui/plugin-ui-registry'

// Global panel state
const panelWidth = ref(300)
const isPanelOpen = ref(false)
const panelMode = ref<'default' | 'plugin'>('default')
const activePluginView = ref<RegisteredPluginView | null>(null)

// Plugin UI Registry instance (will be injected from service container)
let pluginUIRegistry: PluginUIRegistry | null = null

/**
 * Enhanced panel state composable that supports both default content and plugin UIs
 */
export function usePanelState() {
  const togglePanel = () => {
    isPanelOpen.value = !isPanelOpen.value
  }

  const setPanelWidth = (width: number) => {
    panelWidth.value = width
  }
  const openPanel = () => {
    console.log('🎛️ [Panel State] Opening panel')
    isPanelOpen.value = true
  }

  const closePanel = () => {
    isPanelOpen.value = false
  }

  const setPanelMode = (mode: 'default' | 'plugin') => {
    panelMode.value = mode
  }
  /**
   * Set the plugin UI registry instance
   */
  const setPluginUIRegistry = (registry: PluginUIRegistry) => {
    console.log('🎛️ [Panel State] Setting plugin UI registry')
    pluginUIRegistry = registry

    // Watch for active view changes from the registry
    watch(
      () => registry.getActiveViewRef().value,
      (newActiveView) => {
        console.log('🎛️ [Panel State] Active view changed:', newActiveView)
        if (newActiveView) {
          activePluginView.value = newActiveView
          panelMode.value = 'plugin'
          console.log('🎛️ [Panel State] Switching to plugin mode, opening panel')
          if (!isPanelOpen.value) {
            openPanel()
          }
        } else {
          activePluginView.value = null
          panelMode.value = 'default'
          console.log('🎛️ [Panel State] Switching to default mode')
        }
      },
      { immediate: true }
    )
  }

  /**
   * Open a specific plugin view
   */
  const openPluginView = (pluginId: string, viewId: string): boolean => {
    if (!pluginUIRegistry) {
      console.warn('Plugin UI Registry not available')
      return false
    }

    const success = pluginUIRegistry.activateViewById(pluginId, viewId)
    if (success) {
      openPanel()
    }
    return success
  }

  /**
   * Close the current plugin view and return to default content
   */
  const closePluginView = (): boolean => {
    if (!pluginUIRegistry || !activePluginView.value) {
      return false
    }

    const success = pluginUIRegistry.deactivateCurrentView()
    if (success) {
      panelMode.value = 'default'
    }
    return success
  }

  /**
   * Get all available plugin views (for view switcher UI)
   */
  const getAvailablePluginViews = () => {
    if (!pluginUIRegistry) {
      return []
    }
    return pluginUIRegistry.getAllViews()
  }

  /**
   * Check if panel is showing plugin content
   */
  const isShowingPluginContent = computed(() => {
    return panelMode.value === 'plugin' && activePluginView.value !== null
  })

  /**
   * Get the current panel title based on mode and active view
   */
  const panelTitle = computed(() => {
    if (isShowingPluginContent.value && activePluginView.value) {
      return activePluginView.value.label
    }
    return 'Panel'
  })

  /**
   * Check if the panel can be closed (some plugin views might not be closable)
   */
  const canClosePanel = computed(() => {
    if (isShowingPluginContent.value && activePluginView.value) {
      return activePluginView.value.closable !== false
    }
    return true
  })

  return {
    // Basic panel state
    panelWidth,
    isPanelOpen,
    panelMode,
    activePluginView,

    // Basic panel controls
    togglePanel,
    setPanelWidth,
    openPanel,
    closePanel,
    setPanelMode,

    // Plugin UI integration
    setPluginUIRegistry,
    openPluginView,
    closePluginView,
    getAvailablePluginViews,

    // Computed properties
    isShowingPluginContent,
    panelTitle,
    canClosePanel
  }
}
