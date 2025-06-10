import { EventType, Handler, WildcardHandler } from '@shared/types'
import { useEventBus } from '@vueuse/core'
import { WebContents } from 'electron'
const electron = require('electron')
let ipcRenderer: any = electron.ipcRenderer
let ipcMain: any = electron.ipcMain

export class EventEmitterWrapper<Events extends Record<EventType, unknown>> {
  private readonly namespace: string
  private readonly eventBusMap: Map<string, any> = new Map()
  private readonly ipcHandlers: Map<string, (event: any, payload: any) => void> = new Map()
  private readonly ipcToLocalBridge: Map<string, (event: any, payload: any) => void> = new Map()
  private readonly wildcardHandlers: Set<WildcardHandler<Events>> = new Set()
  private readonly ipc: any

  constructor(namespace: string) {
    this.namespace = namespace
    this.ipc = ipcRenderer || ipcMain
  }
  private bridgeIpcToLocal<Key extends keyof Events>(eventName: Key): void {
    if (!this.ipc) return

    const eventKey = this.getEventKey(eventName)

    if (this.ipcToLocalBridge.has(eventKey)) return

    const bridgeHandler = (_event: any, payload: Events[Key]) => {
      // When IPC receives an event, emit it to local event bus
      const bus = this.getEventBus(eventName)
      bus.emit(payload)

      // trigger wildcard handlers
      this.wildcardHandlers.forEach((handler) => {
        handler(eventName, payload)
      })
    }

    this.ipc.on(eventKey, bridgeHandler)
    this.ipcToLocalBridge.set(eventKey, bridgeHandler)
  }

  public on<Key extends keyof Events>(eventName: Key, handler: Handler<Events[Key]>): () => void {
    // Set up IPC-to-local bridge for this event
    this.bridgeIpcToLocal(eventName)

    // Register with local event bus
    const bus = this.getEventBus(eventName)
    const localCleanup = bus.on(handler) // Register with IPC if available using the same event key
    let ipcCleanup: (() => void) | null = null
    if (this.ipc) {
      const eventKey = this.getEventKey(eventName)
      const ipcHandler = (_event: any, payload: Events[Key]) => {
        handler(payload)
      }

      this.ipc.on(eventKey, ipcHandler)
      this.ipcHandlers.set(eventKey, ipcHandler)

      ipcCleanup = () => {
        this.ipc.off(eventKey, ipcHandler)
        this.ipcHandlers.delete(eventKey)
      }
    }

    // Return cleanup function that removes both handlers
    return () => {
      localCleanup()
      if (ipcCleanup) {
        ipcCleanup()
      }
    }
  }

  /**
   * Removes a specific event handler.
   *
   * @param eventName The name of the event to stop listening to.
   * @param handler The specific handler function to remove.
   */
  public off<Key extends keyof Events>(eventName: Key, handler: Handler<Events[Key]>): void {
    // Remove from local event bus
    const bus = this.getEventBus(eventName)
    bus.off(handler) // Remove from IPC using the same event key
    if (this.ipc) {
      const eventKey = this.getEventKey(eventName)
      const ipcHandler = this.ipcHandlers.get(eventKey)

      if (ipcHandler) {
        this.ipc.off(eventKey, ipcHandler)
        this.ipcHandlers.delete(eventKey)
      }
    }
  }
  /**
   * Emits an event with the provided payload.
   *
   * @param eventName The name of the event to emit.
   * @param payload The data to send with the event.
   */
  public emit<Key extends keyof Events>(eventName: Key, payload: Events[Key]): void {
    // Emit to local event bus
    const bus = this.getEventBus(eventName)
    bus.emit(payload)

    // Also trigger wildcard handlers for local events
    this.wildcardHandlers.forEach((handler) => {
      handler(eventName, payload)
    }) // Emit via IPC if available using the same event key
    if (this.ipc) {
      const eventKey = this.getEventKey(eventName)

      if (ipcRenderer) {
        // In renderer process, send to main process
        this.ipc.send(eventKey, payload)
      } else if (ipcMain) {
        // In main process, send to all renderer processes
        const { webContents } = require('electron')
        webContents.getAllWebContents().forEach((contents: WebContents) => {
          contents.send(eventKey, payload)
        })
      }
    }
  }

  public clearAllHandlers(eventName?: keyof Events): void {
    if (eventName !== undefined) {
      const eventKey = this.getEventKey(eventName)
      const bus = this.eventBusMap.get(eventKey)

      if (bus) {
        bus.reset()
        this.eventBusMap.delete(eventKey)
      } // Clear IPC handlers using the same event key
      if (this.ipc) {
        const ipcHandler = this.ipcHandlers.get(eventKey)
        if (ipcHandler) {
          this.ipc.removeAllListeners(eventKey)
          this.ipcHandlers.delete(eventKey)
        }

        // Clear IPC-to-local bridge
        const bridgeHandler = this.ipcToLocalBridge.get(eventKey)
        if (bridgeHandler) {
          this.ipc.off(eventKey, bridgeHandler)
          this.ipcToLocalBridge.delete(eventKey)
        }
      }
    } else {
      // Clear all event buses
      this.eventBusMap.forEach((bus) => {
        bus.reset()
      })
      this.eventBusMap.clear() // Clear all IPC handlers
      if (this.ipc) {
        this.ipcHandlers.forEach((_handler, eventKey) => {
          this.ipc.removeAllListeners(eventKey)
        })
        this.ipcHandlers.clear()

        // Clear all IPC-to-local bridges
        this.ipcToLocalBridge.forEach((handler, eventKey) => {
          this.ipc.off(eventKey, handler)
        })
        this.ipcToLocalBridge.clear()
      }

      // Clear wildcard handlers
      this.wildcardHandlers.clear()
    }
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

  /**
   * Registers a wildcard handler that listens to all events.
   *
   * @param handler The function to call when any event is emitted.
   * @returns A function that when called, removes the wildcard handler.
   */
  public onAny(handler: WildcardHandler<Events>): () => void {
    this.wildcardHandlers.add(handler)

    return () => {
      this.wildcardHandlers.delete(handler)
    }
  }

  /**
   * Removes a wildcard handler.
   *
   * @param handler The wildcard handler function to remove.
   */
  public offAny(handler: WildcardHandler<Events>): void {
    this.wildcardHandlers.delete(handler)
  }

  /**
   * Registers an event handler that will only be called once.
   *
   * @param eventName The name of the event to listen to.
   * @param handler The function to call when the event is emitted.
   * @returns A function that when called, removes the registered event handler.
   */
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

  /**
   * Gets all event names that have registered handlers.
   *
   * @returns An array of event names that have active handlers.
   */ public eventNames(): Array<keyof Events> {
    const eventNames: Array<keyof Events> = []

    for (const eventKey of this.eventBusMap.keys()) {
      // Remove the namespace prefix to get the original event name
      const eventName = eventKey.replace(`${this.namespace}:`, '') as keyof Events
      eventNames.push(eventName)
    }

    return eventNames
  }
}
