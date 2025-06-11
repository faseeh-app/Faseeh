import {
  EventType,
  Handler,
  WildcardHandler,
  EventBus
} from '@shared/types'
import { EventEmitter } from 'events'
import { WebContents } from 'electron'

const { ipcMain, webContents } = require('electron')

export class EventBusService<Events extends Record<EventType, unknown>>
  implements EventBus<Events>
{
  private readonly namespace: string
  private readonly localEmitter: EventEmitter = new EventEmitter()
  private readonly ipcHandlers: Map<string, (event: any, payload: any) => void> = new Map()
  private readonly wildcardHandlers: Set<WildcardHandler<Events>> = new Set()

  constructor(namespace: string) {
    this.namespace = namespace
  }

  public on<Key extends keyof Events>(eventName: Key, handler: Handler<Events[Key]>): () => void {
    const eventKey = this.getEventKey(eventName)

    // Register with local event emitter
    this.localEmitter.on(eventKey, handler) // Setup IPC handler if not already done

    if (!this.ipcHandlers.has(eventKey) && ipcMain) {
      const ipcHandler = (_event: any, payload: Events[Key]) => {
        // Emit to local event emitter
        this.localEmitter.emit(eventKey, payload)

        // Trigger wildcard handlers
        this.wildcardHandlers.forEach((handler) => {
          handler(eventName, payload)
        })
      }

      ipcMain.on(eventKey, ipcHandler)
      this.ipcHandlers.set(eventKey, ipcHandler)
    }

    // Return cleanup function
    return () => {
      this.localEmitter.off(eventKey, handler)
    }
  }

  public off<Key extends keyof Events>(eventName: Key, handler: Handler<Events[Key]>): void {
    const eventKey = this.getEventKey(eventName)
    this.localEmitter.off(eventKey, handler)
  }

  public emit<Key extends keyof Events>(eventName: Key, payload: Events[Key]): void {
    const eventKey = this.getEventKey(eventName)

    // Emit to local event emitter
    this.localEmitter.emit(eventKey, payload)

    // Also trigger wildcard handlers for local events
    this.wildcardHandlers.forEach((handler) => {
      handler(eventName, payload)
    })

    // Send to all renderer processes via IPC
    if (webContents) {
      webContents.getAllWebContents().forEach((contents: WebContents) => {
        try {
          contents.send(eventKey, payload)
        } catch (error) {
          // Handle destroyed webContents gracefully
          console.warn(`Failed to send event ${eventKey} to renderer:`, error)
        }
      })
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

      // Clear local event emitter handlers
      this.localEmitter.removeAllListeners(eventKey)

      // Clear IPC handlers
      if (ipcMain) {
        const ipcHandler = this.ipcHandlers.get(eventKey)
        if (ipcHandler) {
          ipcMain.off(eventKey, ipcHandler)
          this.ipcHandlers.delete(eventKey)
        }
      }
    } else {
      // Clear all local event emitter handlers
      this.localEmitter.removeAllListeners()

      // Clear all IPC handlers
      if (ipcMain) {
        this.ipcHandlers.forEach((handler, eventKey) => {
          ipcMain.off(eventKey, handler)
        })
        this.ipcHandlers.clear()
      }

      // Clear wildcard handlers
      this.wildcardHandlers.clear()
    }
  }

  public eventNames(): Array<keyof Events> {
    const eventNames: Array<keyof Events> = []
    const allEventNames = this.localEmitter.eventNames()

    for (const eventName of allEventNames) {
      if (typeof eventName === 'string' && eventName.startsWith(`${this.namespace}:`)) {
        const cleanEventName = eventName.replace(`${this.namespace}:`, '') as keyof Events
        eventNames.push(cleanEventName)
      }
    }

    return eventNames
  }

  private getEventKey<Key extends keyof Events>(eventName: Key): string {
    return `${this.namespace}:${String(eventName)}`
  }
}
