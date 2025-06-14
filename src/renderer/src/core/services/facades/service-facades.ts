import type {
  ContentAdapterRegistration,
  MetadataScraperRegistration,
  PluginEvents,
  BasePlugin,
  IPluginManager,
  IContentAdapterRegistry,
  IMetadataScraperRegistry,
  Handler,
  WildcardHandler
} from '@shared/types/types'

// Facade for ContentAdapterRegistry: only register/unregister
export class ContentAdapterFacade
  implements Pick<IContentAdapterRegistry, 'register' | 'unregister'>
{
  constructor(private registry: IContentAdapterRegistry) {}
  register(registration: ContentAdapterRegistration): void {
    this.registry.register(registration)
  }
  unregister(id: string): void {
    this.registry.unregister(id)
  }
}

// Facade for MetadataScraperRegistry: only register/unregister
export class MetadataScraperFacade
  implements Pick<IMetadataScraperRegistry, 'register' | 'unregister'>
{
  constructor(private registry: IMetadataScraperRegistry) {}
  register(registration: MetadataScraperRegistration): void {
    this.registry.register(registration)
  }
  unregister(id: string): void {
    this.registry.unregister(id)
  }
}

// Facade for PluginManager: only event and getPluginInstance methods
export class PluginManagerFacade
  implements
    Pick<IPluginManager, 'getPluginInstance' | 'on' | 'off' | 'emit' | 'onAny' | 'offAny' | 'once'>
{
  constructor(private manager: IPluginManager) {}
  getPluginInstance(pluginId: string): BasePlugin | null {
    return this.manager.getPluginInstance(pluginId) as BasePlugin | null
  }
  on<Key extends keyof PluginEvents>(
    eventName: Key,
    handler: Handler<PluginEvents[Key]>
  ): () => void {
    return this.manager.on(eventName, handler)
  }
  off<Key extends keyof PluginEvents>(eventName: Key, handler: Handler<PluginEvents[Key]>): void {
    this.manager.off(eventName, handler)
  }
  emit<Key extends keyof PluginEvents>(eventName: Key, payload: PluginEvents[Key]): void {
    this.manager.emit(eventName, payload)
  }
  onAny(handler: WildcardHandler<PluginEvents>): () => void {
    return this.manager.onAny(handler)
  }
  offAny(handler: WildcardHandler<PluginEvents>): void {
    this.manager.offAny(handler)
  }
  once<Key extends keyof PluginEvents>(
    eventName: Key,
    handler: Handler<PluginEvents[Key]>
  ): () => void {
    return this.manager.once(eventName, handler)
  }
}
