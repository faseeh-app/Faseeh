import type { EventEmitterWrapper } from '@shared/utilities/event-system/event-emitter-wrapper'
import { IStorage } from '@root/src/shared/domain-storage'

/* -------------------------------------------------------------------------- */
/*                                 Model Types                                */
/* -------------------------------------------------------------------------- */

/**
 * Represents a positional bounding box
 * @public
 */
export interface BoundingBox {
  x: number // Top-left X or Left offset
  y: number // Top-left Y or Top offset
  width: number // Width of the box
  height: number // Height of the box
  unit: 'px' | '%' | 'relative' // Coordinate system unit
}

/**
 * Basic properties common to all blocks
 * @public
 */
export interface BaseBlock {
  id: string // Unique within the document
  order: number // Display/reading order
  position?: BoundingBox // Optional absolute positioning for layout-sensitive content
}

/**
 * Represents a block of text
 * @public
 */
export interface TextBlock extends BaseBlock {
  type: 'text'
  content: string
  style?: string // e.g., 'paragraph', 'h1', 'li', 'caption'
  language?: string // Specific language if different from document default
}

/**
 * Represents an image
 * @public
 */
export interface ImageBlock extends BaseBlock {
  type: 'image'
  assetId?: string // Refers to key in FaseehContentDocument.assets (for embedded/managed images)
  externalSrc?: string // URL if image is hosted externally
  alt?: string // Alt text
  caption?: string // Associated caption text
}

/**
 * Represents a video embed
 * @public
 */
export interface VideoBlock extends BaseBlock {
  type: 'video'
  assetId?: string // Refers to a managed video asset
  externalSrc?: string // URL to video (e.g., YouTube, Vimeo, or direct file)
}

/**
 * Represents an audio embed
 * @public
 */
export interface AudioBlock extends BaseBlock {
  type: 'audio'
  assetId?: string // Refers to a managed audio asset
  externalSrc?: string // URL to audio file
}

/**
 * Represents a single text annotation on an image
 * @public
 */
export interface ImageAnnotation {
  id: string // Unique within the parent block
  text: string
  boundingBox: BoundingBox // Position RELATIVE TO THE BASE IMAGE
  type: 'dialogue' | 'sfx' | 'narration' | 'label' | 'caption' | 'title' | 'other' // Semantic type
  order: number // Reading order of annotations on the image
  language?: string
}

/**
 * Represents an image with annotated text regions (comics, diagrams)
 * @public
 */
export interface AnnotatedImageBlock extends BaseBlock {
  type: 'annotatedImage'
  baseImageAssetId: string // Refers to key in FaseehContentDocument.assets
  annotations: ImageAnnotation[] // Array of text annotations on this image
}

/**
 * Represents a structural container for other blocks
 * @public
 */
export interface ContainerBlock extends BaseBlock {
  type: 'container'
  style?: string // e.g., 'section', 'panel', 'figure', 'div'
  children: ContentBlock[] // Nested blocks within this container
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
 * Represents structured, processed content ready for display/interaction
 * @public
 */
export interface ContentDocument {
  version: string // Schema version
  metadata: {
    title?: string
    language?: string
  }
  assets?: {
    // Describes assets STORED SEPARATELY by Storage Service
    [assetId: string]: {
      format: string
      originalSrc?: string
      width?: number
      height?: number
      // Refers to stored asset path implicitly or explicitly via Storage Service lookup
    }
  }
  contentBlocks: ContentBlock[] // Ordered array of content blocks
}

/* -------------------------------------------------------------------------- */
/*                             Event System Types                             */
/* -------------------------------------------------------------------------- */

/**
 * @public
 */
export type EventType = string | symbol | number
/**
 * @public
 */
export type Handler<T = any> = (event: T) => void
/**
 * @public
 */
export type WildcardHandler<Events extends Record<EventType, unknown>> = (
  type: keyof Events,
  event: Events[keyof Events]
) => void

/**
 * Event types related to database and filesystem storage operations.
 * @public
 */
export type StorageEvents = {
  'media:saved': { mediaId: string; path?: string }
  'media:deleted': { mediaId: string }
  // ... other storage events
}

/**
 * Event types related to workspace operations and user interactions.
 * @public
 */
export type WorkspaceEvents = {
  'media:opened': { mediaId: string; source: string }
  'layout:changed': { newLayout: string }
  // ... other workspace events
}

/**
 * Event types related to plugin lifecycle and management.
 * @public
 */
export type PluginEvents = {
  'plugin:loaded': { pluginId: string }
  'plugin:unloaded': { pluginId: string }
  'plugin:listUpdated': PluginInfo[]
  'plugin:disabled': { pluginId: string }
}

/**
 * @public
 */
export type PluginEvent = Record<EventType, unknown>

/* -------------------------------------------------------------------------- */
/*                             Plugin System Types                            */
/* -------------------------------------------------------------------------- */

/**
 * Represents a plugin's manifest.json information
 * @public
 */
export interface PluginManifest {
  // Required
  id: string
  name: string
  version: string
  minAppVersion: string
  main: string // Relative path to entry point JS

  // Optional dependency on other plugins
  pluginDependencies?: string[] // Array of required plugin IDs

  // Recommended
  description: string
  author?: string
  authorUrl?: string
  fundingUrl?: string
}

/**
 * Information about a plugin including its runtime status
 * @public
 */
export interface PluginInfo {
  manifest: PluginManifest
  isEnabled: boolean
  isLoaded: boolean
  hasFailed: boolean
  error?: string
}

/**
 * The FaseehApp object provides plugins with access to application functionality
 * @public
 */
export interface FaseehApp {
  /** Basic application information */
  appInfo: {
    readonly version: string
    readonly platform: 'win' | 'mac' | 'linux'
  }

  /** Storage API facade for accessing the main process storage service */
  storage: IStorage

  /** Access to other plugins */
  plugins: {
    getPlugin(id: string): IPlugin | null
  }

  // Shared event emitters
  workspaceEvents: EventEmitterWrapper<WorkspaceEvents>
  storageEvents: EventEmitterWrapper<StorageEvents>
  pluginEvents: EventEmitterWrapper<PluginEvents>
}

/**
 * Plugin abstract class that all plugins must implement
 * @public
 */
export interface IPlugin {
  app: FaseehApp
  manifest: PluginManifest

  /** Called when the plugin is loaded */
  onload(): Promise<void>

  /** Called when the plugin is unloaded */
  onunload(): void | Promise<void>

  /** Call the event emitter's `on` inside this method to clean up listeners automatically */
  registerEvent(disposer: () => void): void

  // --- Database Storage Methods ---

  /** Load plugin data from database storage */
  loadData(): Promise<any>

  /** Save plugin data to database storage */
  saveData(data: any): Promise<void>

  /**
   * Load plugin data from database storage with library item context
   * @param libraryItemId Optional library item ID to scope the data to
   */
  loadDataWithContext(libraryItemId: string | null): Promise<any>

  /**
   * Save plugin data to database storage with library item context
   * @param data The data to save
   * @param libraryItemId Optional library item ID to scope the data to
   */
  saveDataWithContext(data: any, libraryItemId: string | null): Promise<void>

  // --- File Storage Methods ---

  /**
   * Read plugin data from file storage
   * @param relativePath Path relative to plugin's data directory
   */
  readDataFile(relativePath: string): Promise<string | undefined>

  /**
   * Write plugin data to file storage
   * @param relativePath Path relative to plugin's data directory
   * @param content Content to write to the file
   */
  writeDataFile(relativePath: string, content: string): Promise<boolean>

  /**
   * Delete plugin data file
   * @param relativePath Path relative to plugin's data directory
   */
  deleteDataFile(relativePath: string): Promise<boolean>

  /**
   * List files in plugin's data directory
   * @param subDirectory Optional subdirectory within plugin's data directory
   */
  listDataFiles(subDirectory?: string): Promise<string[]>

  // ---@internalal Methods ---

  /**@internalal method to clean up all registered listeners */
  _cleanupListeners(): void
}

export { EventEmitterWrapper } from '@shared/utilities/event-system/event-emitter-wrapper'
export { Plugin as BasePlugin } from '@renderer/core/services/plugins/base-plugin'
