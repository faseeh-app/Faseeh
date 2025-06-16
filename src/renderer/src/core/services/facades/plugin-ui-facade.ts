import type {
  IPluginUIRegistry,
  PluginUIViewConfig,
  RegisteredPluginView,
  PluginUIEvents
} from '@shared/types/types'
import type { PluginUIRegistry } from '@renderer/core/services/plugin-ui/plugin-ui-registry'

/**
 * Facade for the Plugin UI Registry that exposes only the necessary methods to plugins
 * This prevents plugins from accessing internal registry methods
 */
export class PluginUIFacade
  implements
    Pick<
      IPluginUIRegistry,
      | 'registerView'
      | 'unregisterView'
      | 'activateViewById'
      | 'deactivateCurrentView'
      | 'getAllViews'
      | 'getPluginViews'
      | 'getActiveView'
      | 'getActiveViewRef'
      | 'on'
      | 'off'
      | 'emit'
    >
{
  constructor(private registry: PluginUIRegistry) {}

  registerView(pluginId: string, config: PluginUIViewConfig): string {
    return this.registry.registerView(pluginId, config)
  }

  unregisterView(pluginId: string, viewId: string): boolean {
    return this.registry.unregisterView(pluginId, viewId)
  }

  activateViewById(pluginId: string, viewId: string): boolean {
    return this.registry.activateViewById(pluginId, viewId)
  }

  deactivateCurrentView(): boolean {
    return this.registry.deactivateCurrentView()
  }

  getActiveView(): RegisteredPluginView | null {
    return this.registry.getActiveView()
  }

  getAllViews(): RegisteredPluginView[] {
    return this.registry.getAllViews()
  }

  getPluginViews(pluginId: string): RegisteredPluginView[] {
    return this.registry.getPluginViews(pluginId)
  }

  getActiveViewRef() {
    return this.registry.getActiveViewRef()
  }

  on<Key extends keyof PluginUIEvents>(
    eventName: Key,
    handler: (event: PluginUIEvents[Key]) => void
  ): () => void {
    return this.registry.on(eventName, handler)
  }

  off<Key extends keyof PluginUIEvents>(
    eventName: Key,
    handler: (event: PluginUIEvents[Key]) => void
  ): void {
    return this.registry.off(eventName, handler)
  }

  emit<Key extends keyof PluginUIEvents>(eventName: Key, event: PluginUIEvents[Key]): void {
    this.registry.emit(eventName, event)
  }
}
