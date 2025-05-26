import { EventEmitterWrapper } from '@shared/utilities/event-system/event-emitter-wrapper'
import { WorkspaceEvents, VaultEvents, PluginEvents } from '@shared/types/event-types'

export const workspaceEvents = new EventEmitterWrapper<WorkspaceEvents>('workspace')
export const vaultEvents = new EventEmitterWrapper<VaultEvents>('vault')
export const pluginEvents = new EventEmitterWrapper<PluginEvents>('plugin')
