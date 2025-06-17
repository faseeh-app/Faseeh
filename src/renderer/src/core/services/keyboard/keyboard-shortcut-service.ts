import { ref, reactive } from 'vue'

// Simple event emitter implementation
interface EventMap {
  [key: string]: any
}

class EventEmitter<T extends EventMap> {
  private listeners = new Map<keyof T, Set<(data: any) => void>>()

  on<K extends keyof T>(event: K, handler: (data: T[K]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler)
    
    return () => this.off(event, handler)
  }

  off<K extends keyof T>(event: K, handler: (data: T[K]) => void): void {
    const handlers = this.listeners.get(event)
    if (handlers) {
      handlers.delete(handler)
    }
  }

  emit<K extends keyof T>(event: K, data: T[K]): void {
    const handlers = this.listeners.get(event)
    if (handlers) {
      handlers.forEach(handler => handler(data))
    }
  }
}

// Storage-persisted shortcut definition (what gets saved to settings.json)
export interface PersistedShortcut {
  id: string
  name: string
  description: string
  category: string
  keys: string[]
  enabled: boolean
  global?: boolean
  preventDefault?: boolean
  stopPropagation?: boolean
  contexts?: string[]
}

// Runtime shortcut with handler function (not persisted)
export interface KeyboardShortcut extends PersistedShortcut {
  handler: (event?: KeyboardEvent) => void | Promise<void>
}

// Registration interface for services to register shortcuts
export interface ShortcutRegistration {
  id: string
  name: string
  description: string
  category: string
  defaultKeys: string[]
  handler: (event?: KeyboardEvent) => void | Promise<void>
  global?: boolean
  preventDefault?: boolean
  stopPropagation?: boolean
  contexts?: string[]
}

export interface ShortcutCategory {
  id: string
  name: string
  description: string
  priority: number
}

export interface KeyboardShortcutConflict {
  shortcut1: KeyboardShortcut
  shortcut2: KeyboardShortcut
  conflictingKeys: string[]
}

export interface KeyboardShortcutServiceEvents {
  'shortcut:registered': KeyboardShortcut
  'shortcut:unregistered': string
  'shortcut:triggered': { shortcut: KeyboardShortcut; event: KeyboardEvent }
  'shortcut:changed': { shortcut: KeyboardShortcut; oldKeys: string[]; newKeys: string[] }
  'shortcut:enabled': KeyboardShortcut
  'shortcut:disabled': KeyboardShortcut
  'conflict:detected': KeyboardShortcutConflict
  'conflict:resolved': KeyboardShortcutConflict
  'shortcuts:loaded': PersistedShortcut[]
  'shortcuts:saved': PersistedShortcut[]
}

class KeyboardShortcutService {
  private shortcuts = reactive(new Map<string, KeyboardShortcut>())
  private registrations = new Map<string, ShortcutRegistration>() // Registry of available shortcuts
  private categories = reactive(new Map<string, ShortcutCategory>())
  private keyMappings = reactive(new Map<string, Set<string>>()) // key combo -> shortcut IDs
  private pressedKeys = new Set<string>()
  private eventEmitter: EventEmitter<KeyboardShortcutServiceEvents>
  private isListening = false
  private currentContext = ref<string>('global')
  private storage: any = null // Will be injected
  private isInitialized = false
  
  constructor() {
    this.eventEmitter = new EventEmitter<KeyboardShortcutServiceEvents>()
    this.initializeDefaultCategories()
  }

  // Initialize with storage service
  async initialize(storageService: any): Promise<void> {
    if (this.isInitialized) return
    
    this.storage = storageService
    await this.loadShortcutsFromStorage()
    this.isInitialized = true
  }

  private initializeDefaultCategories(): void {
    this.registerCategory({
      id: 'general',
      name: 'General',
      description: 'General application shortcuts',
      priority: 1
    })

    this.registerCategory({
      id: 'theme',
      name: 'Theme',
      description: 'Theme and appearance shortcuts',
      priority: 2
    })

    this.registerCategory({
      id: 'navigation',
      name: 'Navigation',
      description: 'Navigation and tab management shortcuts',
      priority: 3
    })

    this.registerCategory({
      id: 'editor',
      name: 'Editor',
      description: 'Text editor shortcuts',
      priority: 4
    })

    this.registerCategory({
      id: 'media',
      name: 'Media',
      description: 'Media playback and management shortcuts',
      priority: 5
    })
  }
  // Load shortcuts from storage
  private async loadShortcutsFromStorage(): Promise<void> {
    if (!this.storage) return

    try {
      const persistedShortcuts: PersistedShortcut[] = await this.storage.getSettingValue('keyboard-shortcuts') || []

      // Clear existing runtime shortcuts but keep registrations
      this.shortcuts.clear()
      this.keyMappings.clear()

      // Reconstruct shortcuts from persisted data + registrations
      for (const persisted of persistedShortcuts) {
        const registration = this.registrations.get(persisted.id)
        if (registration) {
          const shortcut: KeyboardShortcut = {
            ...persisted,
            handler: registration.handler
          }
          this.shortcuts.set(persisted.id, shortcut)
          this.updateKeyMappings(shortcut)
        }
      }

      this.eventEmitter.emit('shortcuts:loaded', persistedShortcuts)
    } catch (error) {
      console.error('Failed to load shortcuts from storage:', error)
    }
  }
  // Save shortcuts to storage
  private async saveShortcutsToStorage(): Promise<void> {
    if (!this.storage) return

    try {
      const persistedShortcuts: PersistedShortcut[] = Array.from(this.shortcuts.values()).map(shortcut => ({
        id: shortcut.id,
        name: shortcut.name,
        description: shortcut.description,
        category: shortcut.category,
        keys: shortcut.keys,
        enabled: shortcut.enabled,
        global: shortcut.global,
        preventDefault: shortcut.preventDefault,
        stopPropagation: shortcut.stopPropagation,
        contexts: shortcut.contexts
      }))

      await this.storage.setSettingValue('keyboard-shortcuts', persistedShortcuts)

      this.eventEmitter.emit('shortcuts:saved', persistedShortcuts)
    } catch (error) {
      console.error('Failed to save shortcuts to storage:', error)
    }
  }

  // Register a shortcut handler (called by services)
  registerShortcutHandler(registration: ShortcutRegistration): void {
    this.registrations.set(registration.id, registration)

    // Check if we already have a persisted version of this shortcut
    const existingShortcut = this.shortcuts.get(registration.id)
    
    if (existingShortcut) {
      // Update handler for existing shortcut
      existingShortcut.handler = registration.handler
    } else {
      // Create new shortcut with default settings
      const shortcut: KeyboardShortcut = {
        id: registration.id,
        name: registration.name,
        description: registration.description,
        category: registration.category,
        keys: registration.defaultKeys,
        enabled: true,
        global: registration.global,
        preventDefault: registration.preventDefault,
        stopPropagation: registration.stopPropagation,
        contexts: registration.contexts,
        handler: registration.handler
      }

      this.shortcuts.set(registration.id, shortcut)
      this.updateKeyMappings(shortcut)
      
      // Save to storage
      this.saveShortcutsToStorage()
      this.eventEmitter.emit('shortcut:registered', shortcut)
    }
  }

  // Unregister a shortcut handler
  unregisterShortcutHandler(id: string): void {
    this.registrations.delete(id)
    const shortcut = this.shortcuts.get(id)
    
    if (shortcut) {
      this.removeKeyMappings(shortcut)
      this.shortcuts.delete(id)
      this.saveShortcutsToStorage()
      this.eventEmitter.emit('shortcut:unregistered', id)
    }
  }

  // Update shortcut keys (called from settings)
  async updateShortcutKeys(id: string, newKeys: string[]): Promise<boolean> {
    const shortcut = this.shortcuts.get(id)
    if (!shortcut) return false

    const oldKeys = [...shortcut.keys]

    // Remove old key mappings
    this.removeKeyMappings(shortcut)

    // Check for conflicts with new keys
    const tempShortcut = { ...shortcut, keys: newKeys }
    const conflicts = this.findConflicts(tempShortcut)
    if (conflicts.length > 0) {
      // Restore old mappings
      this.updateKeyMappings(shortcut)
      return false
    }

    // Update shortcut
    shortcut.keys = newKeys
    this.updateKeyMappings(shortcut)

    await this.saveShortcutsToStorage()
    this.eventEmitter.emit('shortcut:changed', { shortcut, oldKeys, newKeys })
    return true
  }

  async enableShortcut(id: string): Promise<boolean> {
    const shortcut = this.shortcuts.get(id)
    if (!shortcut) return false

    shortcut.enabled = true
    await this.saveShortcutsToStorage()
    this.eventEmitter.emit('shortcut:enabled', shortcut)
    return true
  }

  async disableShortcut(id: string): Promise<boolean> {
    const shortcut = this.shortcuts.get(id)
    if (!shortcut) return false

    shortcut.enabled = false
    await this.saveShortcutsToStorage()
    this.eventEmitter.emit('shortcut:disabled', shortcut)
    return true
  }

  // Helper methods for key mappings
  private updateKeyMappings(shortcut: KeyboardShortcut): void {
    shortcut.keys.forEach(keyCombo => {
      const normalizedKey = this.normalizeKeyCombo(keyCombo)
      if (!this.keyMappings.has(normalizedKey)) {
        this.keyMappings.set(normalizedKey, new Set())
      }
      this.keyMappings.get(normalizedKey)!.add(shortcut.id)
    })
  }

  private removeKeyMappings(shortcut: KeyboardShortcut): void {
    shortcut.keys.forEach(keyCombo => {
      const normalizedKey = this.normalizeKeyCombo(keyCombo)
      const shortcuts = this.keyMappings.get(normalizedKey)
      if (shortcuts) {
        shortcuts.delete(shortcut.id)
        if (shortcuts.size === 0) {
          this.keyMappings.delete(normalizedKey)
        }
      }
    })
  }

  // Category management
  registerCategory(category: ShortcutCategory): void {
    this.categories.set(category.id, category)
  }

  getCategories(): ShortcutCategory[] {
    return Array.from(this.categories.values()).sort((a, b) => a.priority - b.priority)
  }

  getCategory(id: string): ShortcutCategory | undefined {
    return this.categories.get(id)
  }

  // Context management
  setContext(context: string): void {
    this.currentContext.value = context
  }

  getContext(): string {
    return this.currentContext.value
  }

  // Shortcut retrieval
  getShortcut(id: string): KeyboardShortcut | undefined {
    return this.shortcuts.get(id)
  }

  getAllShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values())
  }

  getShortcutsByCategory(categoryId: string): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values()).filter(s => s.category === categoryId)
  }

  getShortcutsByKeys(keyCombo: string): KeyboardShortcut[] {
    const normalizedKey = this.normalizeKeyCombo(keyCombo)
    const shortcutIds = this.keyMappings.get(normalizedKey)
    if (!shortcutIds) return []

    return Array.from(shortcutIds)
      .map(id => this.shortcuts.get(id))
      .filter((s): s is KeyboardShortcut => s !== undefined)
  }

  // Search functionality
  searchShortcuts(query: string): KeyboardShortcut[] {
    const lowerQuery = query.toLowerCase()
    return Array.from(this.shortcuts.values()).filter(shortcut => 
      shortcut.name.toLowerCase().includes(lowerQuery) ||
      shortcut.description.toLowerCase().includes(lowerQuery) ||
      shortcut.keys.some(key => key.toLowerCase().includes(lowerQuery)) ||
      shortcut.category.toLowerCase().includes(lowerQuery)
    )
  }

  // Conflict detection
  findConflicts(shortcut: KeyboardShortcut): KeyboardShortcutConflict[] {
    const conflicts: KeyboardShortcutConflict[] = []

    shortcut.keys.forEach(keyCombo => {
      const normalizedKey = this.normalizeKeyCombo(keyCombo)
      const existingShortcuts = this.getShortcutsByKeys(normalizedKey)
      
      existingShortcuts.forEach(existing => {
        if (existing.id !== shortcut.id && this.hasContextOverlap(shortcut, existing)) {
          conflicts.push({
            shortcut1: shortcut,
            shortcut2: existing,
            conflictingKeys: [keyCombo]
          })
        }
      })
    })

    return conflicts
  }

  findAllConflicts(): KeyboardShortcutConflict[] {
    const conflicts: KeyboardShortcutConflict[] = []
    const shortcuts = Array.from(this.shortcuts.values())

    for (let i = 0; i < shortcuts.length; i++) {
      for (let j = i + 1; j < shortcuts.length; j++) {
        const shortcut1 = shortcuts[i]
        const shortcut2 = shortcuts[j]
        const conflictingKeys = this.getConflictingKeys(shortcut1, shortcut2)
        
        if (conflictingKeys.length > 0 && this.hasContextOverlap(shortcut1, shortcut2)) {
          conflicts.push({
            shortcut1,
            shortcut2,
            conflictingKeys
          })
        }
      }
    }

    return conflicts
  }

  private getConflictingKeys(shortcut1: KeyboardShortcut, shortcut2: KeyboardShortcut): string[] {
    const conflicting: string[] = []
    
    shortcut1.keys.forEach(key1 => {
      shortcut2.keys.forEach(key2 => {
        if (this.normalizeKeyCombo(key1) === this.normalizeKeyCombo(key2)) {
          conflicting.push(key1)
        }
      })
    })

    return conflicting
  }

  private hasContextOverlap(shortcut1: KeyboardShortcut, shortcut2: KeyboardShortcut): boolean {
    if (shortcut1.global || shortcut2.global) return true
    if (!shortcut1.contexts || !shortcut2.contexts) return true
    
    return shortcut1.contexts.some(ctx => shortcut2.contexts!.includes(ctx))
  }

  // Key normalization
  private normalizeKeyCombo(keyCombo: string): string {
    const parts = keyCombo.toLowerCase().split('+')
    const modifiers = parts.slice(0, -1).sort()
    const key = parts[parts.length - 1]
    
    return [...modifiers, key].join('+')
  }

  // Event handling
  private handleKeyDown = (event: KeyboardEvent): void => {
    const keyCombo = this.buildKeyCombo(event)
    const normalizedKey = this.normalizeKeyCombo(keyCombo)
    
    if (this.pressedKeys.has(normalizedKey)) return
    this.pressedKeys.add(normalizedKey)

    const shortcuts = this.getShortcutsByKeys(normalizedKey)
    const activeShortcuts = shortcuts.filter(s => 
      s.enabled && this.isShortcutActiveInContext(s)
    )

    if (activeShortcuts.length > 0) {
      const shortcut = activeShortcuts[0] // Use first matching shortcut
      
      if (shortcut.preventDefault !== false) {
        event.preventDefault()
      }
      if (shortcut.stopPropagation) {
        event.stopPropagation()
      }

      try {
        shortcut.handler(event)
        this.eventEmitter.emit('shortcut:triggered', { shortcut, event })
      } catch (error) {
        console.error(`Error executing shortcut ${shortcut.id}:`, error)
      }
    }
  }

  private handleKeyUp = (event: KeyboardEvent): void => {
    const keyCombo = this.buildKeyCombo(event)
    const normalizedKey = this.normalizeKeyCombo(keyCombo)
    this.pressedKeys.delete(normalizedKey)

    // Clear modifier-specific keys when modifiers are released
    if (!event.ctrlKey || !event.shiftKey || !event.altKey || !event.metaKey) {
      const keysToRemove = Array.from(this.pressedKeys).filter(key => {
        if (!event.ctrlKey && key.includes('ctrl+')) return true
        if (!event.shiftKey && key.includes('shift+')) return true
        if (!event.altKey && key.includes('alt+')) return true
        if (!event.metaKey && key.includes('meta+')) return true
        return false
      })
      
      keysToRemove.forEach(key => this.pressedKeys.delete(key))
    }
  }

  private buildKeyCombo(event: KeyboardEvent): string {
    const parts: string[] = []
    
    if (event.ctrlKey) parts.push('ctrl')
    if (event.shiftKey) parts.push('shift')
    if (event.altKey) parts.push('alt')
    if (event.metaKey) parts.push('meta')
    
    parts.push(event.key.toLowerCase())
    
    return parts.join('+')
  }

  private isShortcutActiveInContext(shortcut: KeyboardShortcut): boolean {
    if (shortcut.global) return true
    if (!shortcut.contexts) return true
    
    return shortcut.contexts.includes(this.currentContext.value)
  }

  // Service lifecycle
  startListening(): void {
    if (this.isListening) return

    document.addEventListener('keydown', this.handleKeyDown)
    document.addEventListener('keyup', this.handleKeyUp)
    this.isListening = true
  }

  stopListening(): void {
    if (!this.isListening) return

    document.removeEventListener('keydown', this.handleKeyDown)
    document.removeEventListener('keyup', this.handleKeyUp)
    this.pressedKeys.clear()
    this.isListening = false
  }

  // Event emitter access
  on<K extends keyof KeyboardShortcutServiceEvents>(
    event: K,
    handler: (data: KeyboardShortcutServiceEvents[K]) => void
  ): () => void {
    return this.eventEmitter.on(event, handler)
  }

  off<K extends keyof KeyboardShortcutServiceEvents>(
    event: K,
    handler: (data: KeyboardShortcutServiceEvents[K]) => void
  ): void {
    this.eventEmitter.off(event, handler)
  }

  // Utility methods
  formatKeyCombo(keyCombo: string): string {
    return keyCombo
      .split('+')
      .map(part => {
        switch (part.toLowerCase()) {
          case 'ctrl': return 'Ctrl'
          case 'shift': return 'Shift'
          case 'alt': return 'Alt'
          case 'meta': return 'Cmd'
          default: return part.charAt(0).toUpperCase() + part.slice(1)
        }
      })
      .join('+')
  }

  isValidKeyCombo(keyCombo: string): boolean {
    const parts = keyCombo.toLowerCase().split('+')
    if (parts.length === 0) return false
    
    const validModifiers = ['ctrl', 'shift', 'alt', 'meta']
    const modifiers = parts.slice(0, -1)
    
    return modifiers.every(mod => validModifiers.includes(mod))
  }

  // Reset shortcuts to defaults
  async resetToDefaults(): Promise<void> {
    // Clear all persisted shortcuts
    this.shortcuts.clear()
    this.keyMappings.clear()

    // Re-register all handlers with their default keys
    for (const [id, registration] of this.registrations) {
      const shortcut: KeyboardShortcut = {
        id: registration.id,
        name: registration.name,
        description: registration.description,
        category: registration.category,
        keys: registration.defaultKeys,
        enabled: true,
        global: registration.global,
        preventDefault: registration.preventDefault,
        stopPropagation: registration.stopPropagation,
        contexts: registration.contexts,
        handler: registration.handler
      }

      this.shortcuts.set(id, shortcut)
      this.updateKeyMappings(shortcut)
    }

    await this.saveShortcutsToStorage()
  }
}

// Export singleton instance
export const keyboardShortcutService = new KeyboardShortcutService()
export type { KeyboardShortcutService }
