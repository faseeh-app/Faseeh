import { EventBusService } from '@renderer/core/services/event-bus/event-bus-service'
import { WorkspaceEvents } from '@root/src/shared/types/types'

class WorkspaceService extends EventBusService<WorkspaceEvents> {
  constructor() {
    super('workspace')
  }
}

export const workspaceService = new WorkspaceService()
