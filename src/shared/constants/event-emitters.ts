import { EventEmitterWrapper } from '@shared/utilities/event-system/event-emitter-wrapper'
import { WorkspaceEvents, StorageEvents, PluginEvents } from '@shared/types'

export const workspaceEvents = new EventEmitterWrapper<WorkspaceEvents>('workspace')
export const storageEvents = new EventEmitterWrapper<StorageEvents>('storage')
export const pluginEvents = new EventEmitterWrapper<PluginEvents>('plugin')
