import { PluginInfo } from '@renderer/core/services/plugin-manager'

export type EventType = string | symbol | number
export type Handler<T = any> = (event: T) => void
export type WildcardHandler<Events extends Record<EventType, unknown>> = (
  type: keyof Events,
  event: Events[keyof Events]
) => void

export interface IListenerOwner {
  _trackListenerRegistration(
    emitterWrapperInstance: EventEmitterWrapper<any>,
    eventName: EventType,
    handler: Handler<any> | WildcardHandler<any>
  ): void
}

export type VaultEvents = {
  'media:saved': { mediaId: string; path?: string }
  'media:deleted': { mediaId: string }
  // ... other vault events
}

export type WorkspaceEvents = {
  'media:opened': { mediaId: string; source: string }
  'layout:changed': { newLayout: string }
  // ... other workspace events
}

export type PluginEvents = {
  'plugin:loaded': { pluginId: string }
  'plugin:unloaded': { pluginId: string }
  'plugin:listUpdated': PluginInfo[]
  'plugin:disabled': { pluginId: string }
}

export type PluginEvent = Record<EventType, unknown>
