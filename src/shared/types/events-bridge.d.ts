export interface IEventsBridge {
  /**
   * Send an event through the event bridge
   * @param channel The event channel (with namespace)
   * @param data The event payload
   */
  send: (channel: string, data: unknown) => void

  /**
   * Listen for events coming through the bridge
   * @param callback Function called when an event arrives
   * @returns A cleanup function to remove the listener
   */
  on: (callback: (channel: string, data: unknown) => void) => () => void
}
