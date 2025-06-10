/**
 * Faseeh Plugin API Entry Point
 *
 * This file serves as the main entry point for the Faseeh Plugin API.
 * Only types and interfaces marked with @public will be included
 * in the generated faseeh.d.ts file.
 *
 * @public
 */

// ============================================================================
// CORE TYPES & UTILITIES
// ============================================================================

/**
 * Generic event type for type-safe event handling
 * @public
 */
export type EventType = string | symbol | number

/**
 * Event handler function type
 * @public
 */
export type Handler<T = unknown> = (event: T) => void

/**
 * Wildcard event handler function type
 * @public
 */
export type WildcardHandler<T = Record<EventType, unknown>> = (
  type: keyof T,
  event: T[keyof T]
) => void

// ============================================================================
// PLUGIN MANIFEST & INFO
// ============================================================================

/**
 * Plugin manifest structure
 * @public
 */
export interface PluginManifest {
  id: string
  name: string
  version: string
  description: string
  author: string
  main: string
  permissions?: string[]
  dependencies?: Record<string, string>
}

/**
 * Plugin information structure
 * @public
 */
export interface PluginInfo {
  id: string
  name: string
  version: string
  description: string
  author: string
  enabled: boolean
  loadedAt?: Date
}

// ============================================================================
// EVENT SYSTEM
// ============================================================================

/**
 * Event emitter wrapper interface for plugins
 * @public
 */
export interface EventEmitterWrapper<
  TEvents extends Record<EventType, any> = Record<EventType, any>
> {
  on<TEventName extends keyof TEvents & EventType>(
    eventName: TEventName,
    handler: Handler<TEvents[TEventName]>
  ): () => void

  on<TEventName extends keyof TEvents & EventType>(
    eventName: TEventName,
    handler: WildcardHandler<TEvents>
  ): () => void

  emit<TEventName extends keyof TEvents & EventType>(
    eventName: TEventName,
    event: TEvents[TEventName]
  ): void

  off<TEventName extends keyof TEvents & EventType>(
    eventName: TEventName,
    handler?: Handler<TEvents[TEventName]>
  ): void

  removeAllListeners(): void
}

/**
 * Storage-related events
 * @public
 */
export interface StorageEvents {
  'library-item:created': { id: string; item: LibraryItem }
  'library-item:updated': { id: string; item: LibraryItem }
  'library-item:deleted': { id: string }
  'content-group:created': { id: string; group: ContentGroup }
  'content-group:updated': { id: string; group: ContentGroup }
  'content-group:deleted': { id: string }
}

/**
 * Workspace-related events
 * @public
 */
export interface WorkspaceEvents {
  'workspace:opened': { path: string }
  'workspace:closed': { path: string }
  'workspace:changed': { oldPath: string; newPath: string }
}

/**
 * Plugin system events
 * @public
 */
export interface PluginEvents {
  'plugin:loaded': { id: string; plugin: PluginInfo }
  'plugin:unloaded': { id: string }
  'plugin:enabled': { id: string }
  'plugin:disabled': { id: string }
  'plugin:error': { id: string; error: Error }
}

// ============================================================================
// CONTENT DOCUMENT TYPES
// ============================================================================

/**
 * Bounding box for content positioning
 * @public
 */
export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Base properties for all content blocks
 * @public
 */
export interface BaseBlock {
  id: string
  type: string
  position?: BoundingBox
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

/**
 * Text content block
 * @public
 */
export interface TextBlock extends BaseBlock {
  type: 'text'
  content: string
  language?: string
  fontSize?: number
  fontFamily?: string
}

/**
 * Image content block
 * @public
 */
export interface ImageBlock extends BaseBlock {
  type: 'image'
  assetId?: string
  externalSrc?: string
  alt?: string
  caption?: string
}

/**
 * Video content block
 * @public
 */
export interface VideoBlock extends BaseBlock {
  type: 'video'
  assetId?: string
  externalSrc?: string
  thumbnail?: string
  duration?: number
}

/**
 * Audio content block
 * @public
 */
export interface AudioBlock extends BaseBlock {
  type: 'audio'
  assetId?: string
  externalSrc?: string
}

/**
 * Image annotation for annotated images
 * @public
 */
export interface ImageAnnotation {
  id: string
  boundingBox: BoundingBox
  text: string
  confidence?: number
}

/**
 * Annotated image block with text regions
 * @public
 */
export interface AnnotatedImageBlock extends BaseBlock {
  type: 'annotatedImage'
  baseImageAssetId: string
  annotations: ImageAnnotation[]
}

/**
 * Container block that holds other blocks
 * @public
 */
export interface ContainerBlock extends BaseBlock {
  type: 'container'
  children: ContentBlock[]
  layout?: 'vertical' | 'horizontal' | 'grid'
}

/**
 * Union type for all possible content blocks
 * @public
 */
export type ContentBlock =
  | TextBlock
  | ImageBlock
  | VideoBlock
  | AudioBlock
  | AnnotatedImageBlock
  | ContainerBlock

/**
 * Complete content document structure
 * @public
 */
export interface ContentDocument {
  id: string
  title: string
  blocks: ContentBlock[]
  language?: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// DATABASE ENTITY TYPES
// ============================================================================

/**
 * Library item entity
 * @public
 */
export interface LibraryItem {
  id: string
  title: string
  content: ContentDocument
  tags: string[]
  language?: string
  source?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Plugin-specific data storage
 * @public
 */
export interface PluginData {
  id: string
  pluginId: string
  key: string
  value: any
  createdAt: Date
  updatedAt: Date
}

/**
 * Application settings
 * @public
 */
export interface AppSettings {
  key: string
  value: any
  createdAt: Date
  updatedAt: Date
}

/**
 * Content group for organizing items
 * @public
 */
export interface ContentGroup {
  id: string
  name: string
  description?: string
  itemIds: string[]
  createdAt: Date
  updatedAt: Date
}

/**
 * Collection entity
 * @public
 */
export interface Collection {
  id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Collection membership
 * @public
 */
export interface CollectionMember {
  id: string
  collectionId: string
  itemId: string
  addedAt: Date
}

/**
 * Vocabulary registry entry
 * @public
 */
export interface VocabularyRegistry {
  id: string
  term: string
  definition: string
  language: string
  sourceId?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Vocabulary source
 * @public
 */
export interface VocabularySource {
  id: string
  name: string
  description?: string
  url?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Embedded asset
 * @public
 */
export interface EmbeddedAsset {
  id: string
  filename: string
  mimeType: string
  size: number
  hash: string
  createdAt: Date
}

/**
 * Supplementary file
 * @public
 */
export interface SupplementaryFile {
  id: string
  itemId: string
  filename: string
  mimeType: string
  size: number
  purpose: string
  createdAt: Date
}

// Create types for new entities (without id, createdAt, updatedAt)
/**
 * @public
 */
export type NewLibraryItem = Omit<LibraryItem, 'id' | 'createdAt' | 'updatedAt'>
/**
 * @public
 */
export type NewPluginData = Omit<PluginData, 'id' | 'createdAt' | 'updatedAt'>
/**
 * @public
 */
export type NewAppSettings = Omit<AppSettings, 'createdAt' | 'updatedAt'>
/**
 * @public
 */
export type NewContentGroup = Omit<ContentGroup, 'id' | 'createdAt' | 'updatedAt'>
/**
 * @public
 */
export type NewCollection = Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>
/**
 * @public
 */
export type NewCollectionMember = Omit<CollectionMember, 'id' | 'addedAt'>
/**
 * @public
 */
export type NewVocabularyRegistry = Omit<VocabularyRegistry, 'id' | 'createdAt' | 'updatedAt'>
/**
 * @public
 */
export type NewVocabularySource = Omit<VocabularySource, 'id' | 'createdAt' | 'updatedAt'>
/**
 * @public
 */
export type NewEmbeddedAsset = Omit<EmbeddedAsset, 'id' | 'createdAt'>
/**
 * @public
 */
export type NewSupplementaryFile = Omit<SupplementaryFile, 'id' | 'createdAt'>

// Create types for updates (partial, without id, createdAt)
/**
 * @public
 */
export type LibraryItemUpdate = Partial<Omit<LibraryItem, 'id' | 'createdAt'>>
/**
 * @public
 */
export type PluginDataUpdate = Partial<Omit<PluginData, 'id' | 'createdAt'>>
/**
 * @public
 */
export type AppSettingsUpdate = Partial<Omit<AppSettings, 'key' | 'createdAt'>>
/**
 * @public
 */
export type ContentGroupUpdate = Partial<Omit<ContentGroup, 'id' | 'createdAt'>>
/**
 * @public
 */
export type CollectionUpdate = Partial<Omit<Collection, 'id' | 'createdAt'>>
/**
 * @public
 */
export type CollectionMemberUpdate = Partial<Omit<CollectionMember, 'id'>>
/**
 * @public
 */
export type VocabularyRegistryUpdate = Partial<Omit<VocabularyRegistry, 'id' | 'createdAt'>>
/**
 * @public
 */
export type VocabularySourceUpdate = Partial<Omit<VocabularySource, 'id' | 'createdAt'>>
/**
 * @public
 */
export type EmbeddedAssetUpdate = Partial<Omit<EmbeddedAsset, 'id' | 'createdAt'>>
/**
 * @public
 */
export type SupplementaryFileUpdate = Partial<Omit<SupplementaryFile, 'id' | 'createdAt'>>

// ============================================================================
// STORAGE API
// ============================================================================

/**
 * Storage API interface for database operations
 * @public
 */
export interface StorageAPI {
  // Library Items
  createLibraryItem(item: NewLibraryItem): Promise<LibraryItem>
  getLibraryItem(id: string): Promise<LibraryItem | null>
  updateLibraryItem(id: string, updates: LibraryItemUpdate): Promise<LibraryItem>
  deleteLibraryItem(id: string): Promise<void>
  listLibraryItems(options?: {
    limit?: number
    offset?: number
    tags?: string[]
  }): Promise<LibraryItem[]>

  // Plugin Data
  setPluginData(pluginId: string, key: string, value: any): Promise<void>
  getPluginData(pluginId: string, key: string): Promise<any>
  deletePluginData(pluginId: string, key: string): Promise<void>
  listPluginData(pluginId: string): Promise<PluginData[]>

  // App Settings
  setSetting(key: string, value: any): Promise<void>
  getSetting(key: string): Promise<any>
  deleteSetting(key: string): Promise<void>
  listSettings(): Promise<AppSettings[]>

  // Content Groups
  createContentGroup(group: NewContentGroup): Promise<ContentGroup>
  getContentGroup(id: string): Promise<ContentGroup | null>
  updateContentGroup(id: string, updates: ContentGroupUpdate): Promise<ContentGroup>
  deleteContentGroup(id: string): Promise<void>
  listContentGroups(): Promise<ContentGroup[]>

  // Collections
  createCollection(collection: NewCollection): Promise<Collection>
  getCollection(id: string): Promise<Collection | null>
  updateCollection(id: string, updates: CollectionUpdate): Promise<Collection>
  deleteCollection(id: string): Promise<void>
  listCollections(): Promise<Collection[]>

  // Collection Members
  addToCollection(collectionId: string, itemId: string): Promise<CollectionMember>
  removeFromCollection(collectionId: string, itemId: string): Promise<void>
  getCollectionMembers(collectionId: string): Promise<CollectionMember[]>
}

// ============================================================================
// FASEEH APP API
// ============================================================================

/**
 * Main Faseeh application API interface
 * @public
 */
export interface FaseehApp {
  appInfo: {
    version: string
    platform: 'win' | 'mac' | 'linux'
  }
  storage: StorageAPI
  plugins: {
    getPlugin(id: string): PluginInfo | null
  }
  workspaceEvents: EventEmitterWrapper<WorkspaceEvents>
  storageEvents: EventEmitterWrapper<StorageEvents>
  pluginEvents: EventEmitterWrapper<PluginEvents>
}

// ============================================================================
// BASE PLUGIN CLASS
// ============================================================================

/**
 * Base plugin class that all plugins must extend
 * @public
 */
export abstract class BasePlugin {
  /**
   * Plugin manifest information
   * @public
   */
  public abstract readonly manifest: PluginManifest

  /**
   * Reference to the Faseeh app API
   * @public
   */
  protected app!: FaseehApp

  /**
   * Initialize the plugin with the Faseeh app instance
   * @param app - The Faseeh app API
   * @public
   */
  public initialize(app: FaseehApp): void {
    this.app = app
  }

  /**
   * Called when the plugin is activated
   * @public
   */
  public abstract onActivate(): Promise<void> | void

  /**
   * Called when the plugin is deactivated
   * @public
   */
  public abstract onDeactivate(): Promise<void> | void
}
