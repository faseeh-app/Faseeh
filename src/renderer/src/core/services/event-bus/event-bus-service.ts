import { EventType, Handler, WildcardHandler, EventBus } from '@shared/types'
import { useEventBus } from '@vueuse/core'

const { ipcRenderer } = require('electron')

export class EventBusService<Events extends Record<EventType, unknown>>
  implements EventBus<Events>
{
  private readonly namespace: string
  private readonly eventBusMap: Map<string, any> = new Map()
  private readonly ipcToLocalBridge: Map<string, (event: any, payload: any) => void> = new Map()
  private readonly wildcardHandlers: Set<WildcardHandler<Events>> = new Set()

  constructor(namespace: string) {
    this.namespace = namespace
  }

  private bridgeIpcToLocal<Key extends keyof Events>(eventName: Key): void {
    if (!ipcRenderer) return

    const eventKey = this.getEventKey(eventName)

    if (this.ipcToLocalBridge.has(eventKey)) return

    const bridgeHandler = (_event: any, payload: Events[Key]) => {
      // When IPC receives an event from main process, emit it to local event bus
      const bus = this.getEventBus(eventName)
      bus.emit(payload)

      // Trigger wildcard handlers
      this.wildcardHandlers.forEach((handler) => {
        handler(eventName, payload)
      })
    }

    ipcRenderer.on(eventKey, bridgeHandler)
    this.ipcToLocalBridge.set(eventKey, bridgeHandler)
  }

  public on<Key extends keyof Events>(eventName: Key, handler: Handler<Events[Key]>): () => void {
    // Set up IPC-to-local bridge for this event
    this.bridgeIpcToLocal(eventName)

    // Register with local event bus
    const bus = this.getEventBus(eventName)
    const localCleanup = bus.on(handler)

    // Return cleanup function
    return () => {
      localCleanup()
    }
  }

  public off<Key extends keyof Events>(eventName: Key, handler: Handler<Events[Key]>): void {
    // Remove from local event bus
    const bus = this.getEventBus(eventName)
    bus.off(handler)
  }

  public emit<Key extends keyof Events>(eventName: Key, payload: Events[Key]): void {
    // Emit to local event bus
    const bus = this.getEventBus(eventName)
    bus.emit(payload)

    // Also trigger wildcard handlers for local events
    this.wildcardHandlers.forEach((handler) => {
      handler(eventName, payload)
    })

    // Send to main process via IPC
    if (ipcRenderer) {
      const eventKey = this.getEventKey(eventName)
      ipcRenderer.send(eventKey, payload)
    }
  }

  public onAny(handler: WildcardHandler<Events>): () => void {
    this.wildcardHandlers.add(handler)

    return () => {
      this.wildcardHandlers.delete(handler)
    }
  }

  public offAny(handler: WildcardHandler<Events>): void {
    this.wildcardHandlers.delete(handler)
  }

  public once<Key extends keyof Events>(eventName: Key, handler: Handler<Events[Key]>): () => void {
    let cleanup: (() => void) | null = null

    const onceHandler = (payload: Events[Key]) => {
      handler(payload)
      if (cleanup) {
        cleanup()
      }
    }

    cleanup = this.on(eventName, onceHandler)
    return cleanup
  }

  public clearAllHandlers(eventName?: keyof Events): void {
    if (eventName !== undefined) {
      const eventKey = this.getEventKey(eventName)
      const bus = this.eventBusMap.get(eventKey)

      if (bus) {
        bus.reset()
        this.eventBusMap.delete(eventKey)
      }

      // Clear IPC-to-local bridge
      if (ipcRenderer) {
        const bridgeHandler = this.ipcToLocalBridge.get(eventKey)
        if (bridgeHandler) {
          ipcRenderer.off(eventKey, bridgeHandler)
          this.ipcToLocalBridge.delete(eventKey)
        }
      }
    } else {
      // Clear all event buses
      this.eventBusMap.forEach((bus) => {
        bus.reset()
      })
      this.eventBusMap.clear()

      // Clear all IPC-to-local bridges
      if (ipcRenderer) {
        this.ipcToLocalBridge.forEach((handler, eventKey) => {
          ipcRenderer.off(eventKey, handler)
        })
        this.ipcToLocalBridge.clear()
      }

      // Clear wildcard handlers
      this.wildcardHandlers.clear()
    }
  }

  public eventNames(): Array<keyof Events> {
    const eventNames: Array<keyof Events> = []

    for (const eventKey of this.eventBusMap.keys()) {
      // Remove the namespace prefix to get the original event name
      const eventName = eventKey.replace(`${this.namespace}:`, '') as keyof Events
      eventNames.push(eventName)
    }

    return eventNames
  }

  private getEventKey<Key extends keyof Events>(eventName: Key): string {
    return `${this.namespace}:${String(eventName)}`
  }

  private getEventBus<Key extends keyof Events>(eventName: Key) {
    const eventKey = this.getEventKey(eventName)

    if (!this.eventBusMap.has(eventKey)) {
      const bus = useEventBus<Events[Key]>(eventKey)
      this.eventBusMap.set(eventKey, bus)
    }

    return this.eventBusMap.get(eventKey)
  }
}
