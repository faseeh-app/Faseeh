import { EventType, Handler } from '@shared/types/event-types'
import { useEventBus } from '@vueuse/core'

export class EventEmitterWrapper<Events extends Record<EventType, unknown>> {
  private readonly namespace: string
  private readonly eventBusMap: Map<string, any> = new Map()

  /**
   * @param namespace A unique namespace to prevent collisions with other events
   */
  constructor(namespace: string) {
    this.namespace = namespace
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
   * Registers an event handler and returns a cleanup function.
   *
   * @param eventName The name of the event to listen to.
   * @param handler The function to call when the event is emitted.
   * @returns A function that when called, removes the registered event handler.
   */
  public on<Key extends keyof Events>(eventName: Key, handler: Handler<Events[Key]>): () => void {
    const bus = this.getEventBus(eventName)
    return bus.on(handler)
  }

  /**
   * Removes a specific event handler.
   *
   * @param eventName The name of the event to stop listening to.
   * @param handler The specific handler function to remove.
   */
  public off<Key extends keyof Events>(eventName: Key, handler: Handler<Events[Key]>): void {
    const bus = this.getEventBus(eventName)
    bus.off(handler)
  }

  /**
   * Emits an event with the provided payload.
   *
   * @param eventName The name of the event to emit.
   * @param payload The data to send with the event.
   */
  public emit<Key extends keyof Events>(eventName: Key, payload: Events[Key]): void {
    const bus = this.getEventBus(eventName)
    bus.emit(payload)
  }

  /**
   * Clears all handlers for a specific event or all events.
   *
   * @param eventName Optional. If provided, only clears handlers for this event.
   *                  If not provided, clears all handlers for all events.
   */
  public clearAllHandlers(eventName?: keyof Events): void {
    if (eventName !== undefined) {
      const eventKey = this.getEventKey(eventName)
      const bus = this.eventBusMap.get(eventKey)

      if (bus) {
        bus.reset()
        this.eventBusMap.delete(eventKey)
      }
    } else {
      // Clear all event buses
      this.eventBusMap.forEach((bus) => {
        bus.reset()
      })
      this.eventBusMap.clear()
    }
  }
}
