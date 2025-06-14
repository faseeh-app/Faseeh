import { LanguageDetector } from '@renderer/core/services/language-detection/language-detector'
import type { IStorage } from '@shared/types/domain-storage'
export type { IStorage }

// Re-export all models that are referenced by the IStorage interface
export type {
  LibraryItem,
  ContentGroup,
  Collection,
  CollectionMember,
  VocabularyEntry,
  VocabularySource,
  EmbeddedAsset,
  SupplementaryFile,
  AppSetting,
  PluginData,
  CreateLibraryItemDTO,
  UpdateLibraryItemDTO,
  CreateContentGroupDTO,
  UpdateContentGroupDTO,
  CreateCollectionDTO,
  UpdateCollectionDTO,
  CreateCollectionMemberDTO,
  CreateVocabularyEntryDTO,
  UpdateVocabularyEntryDTO,
  CreateVocabularySourceDTO,
  CreateEmbeddedAssetDTO,
  UpdateEmbeddedAssetDTO,
  CreateSupplementaryFileDTO,
  UpdateSupplementaryFileDTO,
  CreatePluginDataDTO,
  UpdatePluginDataDTO,
  CreateAppSettingDTO,
  UpdateAppSettingDTO
} from '@shared/types/models'

/* -------------------------------------------------------------------------- */
/*                          Content Document Types                            */
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
  'tab:reload': { tabId: string; title: string }
  'tab:duplicate': { tabId: string; title: string }
  'tab:close': { tabId: string; title: string }
  'tab:close-others': { exceptTabId: string; closedCount: number }
  'tab:close-all': { closedCount: number }
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

/**
 * An event bus for managing events across the application, both in the main process and renderer processes.
 * @public
 */
export interface EventBus<Events extends Record<EventType, unknown>> {
  /**
   * Registers an event handler
   * @param eventName The name of the event to listen to
   * @param handler The function to call when the event is emitted
   * @returns A function that when called, removes the registered event handler
   */
  on<Key extends keyof Events>(eventName: Key, handler: Handler<Events[Key]>): () => void

  /**
   * Removes a specific event handler
   * @param eventName The name of the event to stop listening to
   * @param handler The specific handler function to remove
   */
  off<Key extends keyof Events>(eventName: Key, handler: Handler<Events[Key]>): void

  /**
   * Emits an event with the provided payload
   * @param eventName The name of the event to emit
   * @param payload The data to send with the event
   */
  emit<Key extends keyof Events>(eventName: Key, payload: Events[Key]): void

  /**
   * Registers a wildcard handler that listens to all events
   * @param handler The function to call when any event is emitted
   * @returns A function that when called, removes the wildcard handler
   */
  onAny(handler: WildcardHandler<Events>): () => void

  /**
   * Removes a wildcard handler
   * @param handler The wildcard handler function to remove
   */
  offAny(handler: WildcardHandler<Events>): void

  /**
   * Registers an event handler that will only be called once
   * @param eventName The name of the event to listen to
   * @param handler The function to call when the event is emitted
   * @returns A function that when called, removes the registered event handler
   */
  once<Key extends keyof Events>(eventName: Key, handler: Handler<Events[Key]>): () => void

  /**
   * Clears all handlers for a specific event or all events
   * @param eventName Optional event name to clear handlers for. If not provided, clears all handlers
   */
  clearAllHandlers(eventName?: keyof Events): void

  /**
   * Gets all event names that have registered handlers
   * @returns An array of event names that have active handlers
   */
  eventNames(): Array<keyof Events>
}

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

  plugins: {
    getPlugin: (pluginId: string) => unknown
    enabledPlugins: () => Set<string>
  }

  // Language Detector
  languageDetector: LanguageDetector
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

  /** method to clean up all registered listeners */
  _cleanupListeners(): void
}

export type { BasePlugin } from '@renderer/core/services/plugins/plugin'

/* -------------------------------------------------------------------------- */
/*                          Subtitle Generation Types                         */
/* -------------------------------------------------------------------------- */

// Input data for subtitle generation
export type SubtitleSourceData = Buffer | string
// Audio/Video file content as Buffer, or file path/URL string

/**
 * Represents a single subtitle segment with timing information and text content.
 *
 * @interface SubtitleSegment
 * @example
 * ```typescript
 * const segment: SubtitleSegment = {
 *   startTimeMs: 1000,
 *   endTimeMs: 3000,
 *   text: "Hello, world!",
 *   confidence: 0.95
 * };
 * ```
 * @public
 */
export interface SubtitleSegment {
  /** The start time of the subtitle segment in milliseconds */
  startTimeMs: number

  /** The end time of the subtitle segment in milliseconds */
  endTimeMs: number

  /** The text content displayed during this subtitle segment */
  text: string

  /**
   * Optional confidence score indicating the accuracy of the subtitle text.
   * @remarks Typically ranges from 0.0 (no confidence) to 1.0 (full confidence)
   */
  confidence?: number
}

/**
 * Represents the result of a subtitle generation operation.
 *
 * This interface encapsulates all the data returned after processing
 * audio/video content to generate subtitles, including the detected
 * language, subtitle segments, and metadata about the generation engine.
 *
 * @interface SubtitleGenerationResult * @example
 * ```typescript
 * const result: SubtitleGenerationResult = {
 *   language: 'en',
 *   segments: [
 *     {
 *       startTimeMs: 0,
 *       endTimeMs: 3500,
 *       text: 'Hello, world!',
 *       confidence: 0.95
 *     }
 *   ],
 *   engineInfo: {
 *     id: 'whisper-1',
 *     name: 'OpenAI Whisper',
 *     model: 'whisper-large-v3'
 *   },
 *   raw: {
 *     text: '1\n00:00:00,000 --> 00:00:03,500\nHello, world!\n\n',
 *     format: 'srt'
 *   }
 * };
 * ```
 */
export interface SubtitleGenerationResult {
  language: string // Detected or confirmed language (ISO 639 code)
  segments: SubtitleSegment[]
  engineInfo?: {
    // Info about the engine/model used
    id: string
    name: string
    model?: string // Specific model identifier if applicable
  }

  /**
   * Optional raw subtitle content in a standard format.
   * If provided, contains the subtitles as a formatted string ready for file output.
   */
  raw?: {
    text: string
    format: 'srt' | 'vtt' | 'ttml' | 'scc' | 'stl'
  }
}

// Metadata describing a Subtitle Engine's capabilities
/**
 * Configuration interface for subtitle generation engines.
 *
 * Defines the capabilities, requirements, and metadata for different subtitle
 * generation services, including local plugins and cloud-based services.
 *
 * @interface SubtitleEngineInfo
 * @example
 * ```typescript
 * const engine: SubtitleEngineInfo = {
 *   id: "faseeh-cloud-stt",
 *   name: "Faseeh Cloud",
 *   supportedLanguages: ["en", "ar", "fr"],
 *   inputType: ["audio", "video"],
 *   description: "Cloud-based speech-to-text service",
 *   requiresApiKey: true,
 *   isCloudService: true
 * };
 * ```
 */
export interface SubtitleEngineInfo {
  /**
   * Unique identifier for the subtitle engine.
   * Should follow kebab-case naming convention.
   * @example "faseeh-cloud-stt", "plugin-local-whisper"
   */
  id: string

  /**
   * Human-readable display name for the engine.
   * Used in UI components and user-facing documentation.
   * @example "Faseeh Cloud", "Local Whisper (Medium)"
   */
  name: string

  /**
   * Array of supported language codes in ISO 639 format.
   * Indicates which languages this engine can transcribe.
   * @example ["en", "ar", "fr", "de"]
   */
  supportedLanguages: string[]

  /**
   * Types of input sources the engine can process.
   * - `audio`: Audio files (mp3, wav, etc.)
   * - `video`: Video files (mp4, avi, etc.)
   * - `url`: Remote URLs or streaming sources
   */
  inputType: ('audio' | 'video' | 'url')[]

  /**
   * Optional detailed description of the engine.
   * Should include information about the underlying model, service capabilities,
   * or any special features.
   * @optional
   */
  description?: string

  /**
   * Indicates whether this engine requires an API key for operation.
   * True for cloud services or third-party APIs that need authentication.
   * @optional
   * @default false
   */
  requiresApiKey?: boolean

  /**
   * Indicates whether this engine is a cloud-based service.
   * True for engines that process data remotely, false for local engines.
   * @optional
   * @default false
   */
  isCloudService?: boolean
}

export type { BaseSubtitleEngine } from '@renderer/core/services/subtitle-generation/subtitle-engine' 