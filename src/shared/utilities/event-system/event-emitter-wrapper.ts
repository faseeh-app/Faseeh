import { EventType, Handler } from '@shared/types/event-types'
import { IEventsBridge } from '@shared/types/events-bridge'

declare global {
  interface Window {
    eventsBridge?: IEventsBridge
  }
}

export class EventEmitterWrapper<Events extends Record<EventType, unknown>> {
  private readonly namespace: string
  private readonly localHandlers: Map<string, Set<Handler<any>>> = new Map()
  private cleanupFunctions: Array<() => void> = []

  /**
   * @param namespace A unique namespace to prevent collisions with other events
   */
  constructor(namespace: string) {
    this.namespace = namespace
    this.setupListeners()
  }

  public setupListeners(): void {
    const channelPrefix = `event:${this.namespace}:`

    // Renderer process
    if (this.isRenderer() && typeof window !== 'undefined' && window.eventsBridge) {
      const cleanup = window.eventsBridge.on((channel, payload) => {
        if (channel.startsWith(channelPrefix)) {
          const eventName = channel.slice(channelPrefix.length)
          const handlers = this.localHandlers.get(eventName)
          if (handlers) {
            handlers.forEach((handler) => handler(payload))
          }
        }
      })

      this.cleanupFunctions.push(cleanup)
    } else {
      try {
        // In main process
        const { ipcMain, webContents } = require('electron')
        ipcMain.on('ipc-event', (event, channel, payload) => {
          if (channel.startsWith(channelPrefix)) {
            // Send to all other renderer processes
            const webContentsInstance = event.sender
            const allWebContentsInstances = webContents.getAllWebContents()

            allWebContentsInstances.forEach((contents) => {
              if (contents !== webContentsInstance && !contents.isDestroyed()) {
                contents.send('ipc-event', channel, payload)
              }
            })

            // Trigger local handlers
            const eventName = channel.slice(channelPrefix.length)
            const handlers = this.localHandlers.get(eventName)
            if (handlers) {
              handlers.forEach((handler) => handler(payload))
            }
          }
        })
      } catch (err) {
        console.error('Failed to setup main process listeners:', err)
      }
    }
  }

  private isRenderer(): boolean {
    return typeof window !== 'undefined' && window.document !== undefined
  }

  /**
   * Registers an event handler and returns a cleanup function.
   *
   * @param eventName The name of the event to listen to.
   * @param handler The function to call when the event is emitted.
   * @returns A function that when called, removes the registered event handler.
   */
  public on<Key extends keyof Events>(eventName: Key, handler: Handler<Events[Key]>): () => void {
    const eventNameStr = String(eventName)
    if (!this.localHandlers.has(eventNameStr)) {
      this.localHandlers.set(eventNameStr, new Set())
    }
    this.localHandlers.get(eventNameStr)!.add(handler)

    // Return a disposer function that removes this specific handler
    return () => {
      this.off(eventName, handler)
    }
  }

  public off<Key extends keyof Events>(eventName: Key, handler: Handler<Events[Key]>): void {
    const eventNameStr = String(eventName)
    const handlers = this.localHandlers.get(eventNameStr)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.localHandlers.delete(eventNameStr)
      }
    }
  }

  public emit<Key extends keyof Events>(eventName: Key, payload: Events[Key]): void {
    const channel = `event:${this.namespace}:${String(eventName)}`

    // Emit locally first
    const handlers = this.localHandlers.get(String(eventName))
    if (handlers) {
      handlers.forEach((handler) => handler(payload))
    }

    // Send through IPC
    if (this.isRenderer()) {
      // Renderer process
      if (typeof window !== 'undefined' && window.eventsBridge) {
        window.eventsBridge.send(channel, payload)
      }
    } else {
      // Main process
      try {
        const { webContents } = require('electron')
        webContents.getAllWebContents().forEach((contents) => {
          if (!contents.isDestroyed()) {
            contents.send('ipc-event', channel, payload)
          }
        })
      } catch (err) {
        console.error('Failed to broadcast event:', err)
      }
    }
  }

  public clearAllHandlers(eventName?: keyof Events): void {
    if (eventName !== undefined) {
      this.localHandlers.delete(String(eventName))
    } else {
      this.localHandlers.clear()
    }

    this.cleanupFunctions.forEach((cleanup) => cleanup())
    this.cleanupFunctions = []
  }
}
