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

import type { LibraryItem } from '@shared/types/models'

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
  'plugin:enabled': { pluginId: string }
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
 * Language detection interface for plugins and services that need to identify the language of a given text source.
 * @public
 */
export interface ILanguageDetector {
  /**
   * Detects the language of the provided text source.
   * @param source The text source to analyze, can be a string or a file path.
   * @return A promise that resolves to an ISO 639-3 language code (e.g., 'eng' for English) or null if detection fails.
   */
  detectLanguage(source: string): Promise<string | null>
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
  /** Storage interface for managing all data storage operations in Faseeh.
   * This includes database operations and file system management.*/
  storage: IStorage

  /** Plugin interface for interacting with other plugins in the system.*/
  plugins: Pick<
    IPluginManager,
    'getPluginInstance' | 'on' | 'off' | 'emit' | 'onAny' | 'offAny' | 'once'
  >

  /** A utility for detecting languages from text sources, useful for maintaining consistency with Faseeh's language detection.*/
  languageDetector: ILanguageDetector

  /** A registry for adding new content adapters that can process various content sources (e.g., files, URLs) into the structured Faseeh content format.*/
  content: Pick<IContentAdapterRegistry, 'register' | 'unregister'>

  /** A registry for adding new metadata scrapers that can extract structured metadata from various content sources (e.g., files, URLs).*/
  metadata: Pick<IMetadataScraperRegistry, 'register' | 'unregister'>

  /** Plugin UI registry for managing plugin user interfaces in the side panel.*/
  ui?: Pick<
    IPluginUIRegistry,
    | 'registerView'
    | 'unregisterView'
    | 'activateViewById'
    | 'deactivateCurrentView'
    | 'getAllViews'
    | 'getPluginViews'
    | 'getActiveView'
    | 'getActiveViewRef'
    | 'on'
    | 'off'
    | 'emit'
  >
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

  // --- Plugin UI Methods ---

  /**
   * Register a UI view that will appear in the side panel
   * @param config Configuration for the UI view
   * @returns Unique key for the registered view
   */
  registerView(config: PluginUIViewConfig): string

  /**
   * Open a specific view (either from this plugin or another)
   * @param pluginId ID of the plugin that owns the view
   * @param viewId ID of the view to open
   * @returns true if view was opened successfully
   */
  openView(pluginId: string, viewId: string): boolean

  /**
   * Close a specific view
   * @param pluginId ID of the plugin that owns the view
   * @param viewId ID of the view to close
   * @returns true if view was closed successfully
   */
  closeView(pluginId: string, viewId: string): boolean

  /**
   * Activate a specific view (bring it to front)
   * @param pluginId ID of the plugin that owns the view
   * @param viewId ID of the view to activate
   * @returns true if view was activated successfully
   */
  activateView(pluginId: string, viewId: string): boolean

  /** method to clean up all registered listeners */
  _cleanupListeners(): void
}

/* -------------------------------------------------------------------------- */
/*                               Content Adapter                              */
/* -------------------------------------------------------------------------- */
/**
 * @public
 */
export type ContentAdapterSource = string | Buffer | File
import { ContentAdapter } from '@renderer/core/services/content-adapter/content-adapter'
/**
 * @public
 */
export interface AssetDetail {
  format: string
  content: Buffer | string
}
/**
 * @public
 */
export interface DocumentAssets {
  [assetId: string]: AssetDetail
}
/**
 * @public
 */
export interface ContentAdapterResult {
  libraryItemData: Partial<LibraryItem>
  contentDocument?: ContentDocument

  documentAssets?: DocumentAssets

  associatedFiles?: {
    type: string
    format?: string
    language?: string
    filename?: string
    content: string | Buffer
  }[]
}

// _______________ Adapter Definition types _______________
/**
 * @public
 */
export type ContentAdapterFunction = (
  source: ContentAdapterSource,
  context: {
    app: FaseehApp
    originalPath?: string
    libraryItemId?: string | null
  }
) => Promise<ContentAdapterResult>
/**
 * @public
 */
export interface ContentAdapterInfo {
  id: string
  name: string
  supportedMimeTypes: string[]

  supportedExtensions: string[]

  urlPatterns?: string[] | RegExp[]
  canHandlePastedText?: boolean

  priority?: number

  description?: string
}

// _______________ Adapter Registration types _______________
/**
 * @public
 */
export type ContentAdapterClass = new (info: ContentAdapterInfo) => ContentAdapter

/**
 * @public
 */
export type ContentAdapterRegistration = ContentAdapterInfo &
  (
    | {
        adapter: ContentAdapterFunction
        adapterClass?: undefined
      }
    | {
        adapterClass: ContentAdapterClass
        adapter?: undefined
      }
  )

/**
 * @public
 */
export interface ContentAdapterFindCriteria {
  source: ContentAdapterSource
  mimeType?: string
  fileExtension?: string
  sourceUrl?: string
  isPastedText?: boolean
}

/**
 * Content Adapter Registry for managing the lifecycle of Faseeh content adapters.
 * @public
 */
export interface IContentAdapterRegistry {
  /**
   * Registers a new content adapter.
   *
   * @param registration - The registration details of the content adapter.
   * @throws {Error} If an adapter with the same ID is already registered.
   */
  register(registration: ContentAdapterRegistration): void

  /**
   * Unregisters a content adapter by its unique identifier.
   *
   * @param id - The unique identifier of the content adapter to unregister.
   * @throws {Error} If no adapter with the specified ID is registered.
   */
  unregister(id: string): void

  /**
   * Retrieves a content adapter by its unique identifier.
   *
   * @param id - The unique identifier of the content adapter.
   * @returns The content adapter registration, or `null` if not found.
   * @internal
   */
  getAdapterById(id: string): ContentAdapterRegistration | null

  /**
   * Lists all registered content adapters.
   *
   * @returns An array of all registered content adapter registrations.
   * @internal
   */
  listRegisteredAdapters(): ContentAdapterRegistration[]

  /**
   * Processes a content source using the registered adapters.
   *
   * @param source - The content source to process.
   * @param context - Optional context information for processing, including:
   *   - `originalPath`: The original file path of the source.
   *   - `sourceUrl`: The URL of the source.
   * @returns A promise resolving to an object indicating the success of the operation,
   *          and optionally including a `libraryItemId` or an error message.
   * @internal
   */
  processSource(
    source: ContentAdapterSource,
    context?: {
      originalPath?: string
      sourceUrl?: string
    }
  ): Promise<{
    success: boolean
    libraryItemId?: string
    error?: string
  }>
}

/* -------------------------------------------------------------------------- */
/*                              Metadata Scraper                              */
/* -------------------------------------------------------------------------- */

import { MetadataScraper } from '@renderer/core/services/metadata-scraper/metadata-scraper'
import { Token } from '@shared/types/text-tokenizer-types'
/**
 * @public
 */
export type MetadataScraperClass = new (info: MetadataScraperInfo) => MetadataScraper
/**
 * @public
 */
export type MetadataScraperSource = string | File
/**
 * @public
 */
export interface MetadataScraperResult {
  type?: string
  name?: string
  thumbnail?: File
  language?: string
  dynamicMetadata: Record<string, any>
}

// _______________ Scraper Definition types _______________
/**
 * @public
 */
export type MetadataScraperFunction = (
  source: MetadataScraperSource,
  context: {
    app: FaseehApp
    originalPath?: string
    sourceUrl?: string
  }
) => Promise<MetadataScraperResult>
/**
 * @public
 */
export interface MetadataScraperInfo {
  id: string
  name: string
  supportedMimeTypes: string[]
  supportedExtensions: string[]
  urlPatterns?: string[] | RegExp[]
  canHandleLocalFiles?: boolean
  canHandleUrls?: boolean
  priority?: number
  description?: string
}
/**
 * @public
 */
export interface MetadataScraperFindCriteria {
  source: MetadataScraperSource
  mimeType?: string
  fileExtension?: string
  sourceUrl?: string
  isLocalFile?: boolean
}

// _______________ Scraper Registration types _______________
/**
 * @public
 */
export type MetadataScraperRegistration = MetadataScraperInfo &
  (
    | {
        scraper: MetadataScraperFunction
        scraperClass?: undefined
      }
    | {
        scraperClass: MetadataScraperClass
        scraper?: undefined
      }
  )

/**
 * Criteria used to find the most suitable metadata scraper for a given source.
 * This interface is used internally by the registry to match sources with appropriate scrapers.
 *
 * @public
 */
export interface MetadataScraperFindCriteria {
  /** The source data to be processed */
  source: MetadataScraperSource

  /** MIME type of the source (e.g., 'video/mp4', 'application/pdf') */
  mimeType?: string

  /** File extension without the dot (e.g., 'pdf', 'mp4', 'txt') */
  fileExtension?: string

  /** Full URL if the source is a web resource */
  sourceUrl?: string

  /** Whether the source is a local file path or File object */
  isLocalFile?: boolean
}

/**
 * Registry interface for managing metadata scrapers in the Faseeh application.
 *
 * The metadata scraper registry provides a centralized system for:
 * - Registering and managing metadata extraction tools
 * - Automatically selecting the best scraper for different content sources
 * - Extracting structured metadata from URLs, files, and other sources
 *
 * The registry uses a sophisticated scoring algorithm to match sources with scrapers
 * based on MIME types, file extensions, URL patterns, and capability flags.
 *
 * @example
 * ```typescript
 * // Basic usage
 * const registry = new MetadataScraperRegistry(app)
 *
 * // Register a scraper
 * registry.register({
 *   id: 'youtube-scraper',
 *   name: 'YouTube Metadata Scraper',
 *   supportedMimeTypes: [],
 *   supportedExtensions: [],
 *   urlPatterns: ['https://(?:www\.)?youtube\.com/watch'],
 *   canHandleUrls: true,
 *   priority: 10,
 *   scraper: async (source, context) => {
 *     // Implementation here
 *     return { type: 'video', name: 'Video Title', language: 'en', dynamicMetadata: {} }
 *   }
 * })
 *
 * // Extract metadata
 * const result = await registry.scrapeMetadata('https://youtube.com/watch?v=example')
 * if (result.success) {
 *   console.log('Title:', result.metadata.name)
 *   console.log('Language:', result.metadata.language)
 *   console.log('Type:', result.metadata.type)
 * }
 * ```
 *
 * @public
 */
export interface IMetadataScraperRegistry {
  /**
   * Registers a new metadata scraper with the registry.
   *
   * The scraper will be available for automatic selection when processing sources
   * that match its supported criteria (MIME types, extensions, URL patterns).
   *
   * @param registration - Complete scraper registration including metadata and implementation
   *
   * @throws {Error} When a scraper with the same ID is already registered
   *
   * @example
   * ```typescript
   * // Register a functional scraper
   * registry.register({
   *   id: 'pdf-scraper',
   *   name: 'PDF Metadata Scraper',
   *   supportedMimeTypes: ['application/pdf'],
   *   supportedExtensions: ['pdf'],
   *   canHandleLocalFiles: true,
   *   priority: 8,
   *   scraper: async (source, context) => {
   *     // PDF processing logic
   *     return {
   *       type: 'document',
   *       name: 'Extracted PDF Title',
   *       language: 'en',
   *       dynamicMetadata: { pageCount: 42, author: 'John Doe' }
   *     }
   *   }
   * })
   *
   * // Register a class-based scraper
   * registry.register({
   *   id: 'custom-scraper',
   *   name: 'Custom Scraper',
   *   supportedMimeTypes: ['text/custom'],
   *   supportedExtensions: ['custom'],
   *   canHandleLocalFiles: true,
   *   priority: 5,
   *   scraperClass: CustomScraperClass
   * })
   * ```
   */
  register(registration: MetadataScraperRegistration): void

  /**
   * Removes a registered metadata scraper from the registry.
   *
   * After unregistration, the scraper will no longer be considered
   * for automatic selection when processing sources.
   *
   * @param id - Unique identifier of the scraper to remove
   *
   * @throws {Error} When no scraper with the specified ID is found
   *
   * @example
   * ```typescript
   * // Unregister a scraper (useful for plugin cleanup)
   * registry.unregister('youtube-scraper')
   * ```
   */
  unregister(id: string): void

  /**
   * Finds the most suitable scraper for the given criteria using a scoring algorithm.
   *
   * The scoring system evaluates scrapers based on:
   * - MIME type match: +3 points
   * - File extension match: +3 points
   * - URL pattern match: +2 points
   * - Local file capability: +2 points
   * - URL handling capability: +2 points
   *
   * When multiple scrapers have the same score, priority values are used as tiebreakers.
   *
   * @param criteria - Source characteristics and requirements for scraper matching
   * @returns The best matching scraper registration, or null if no suitable scraper found
   *
   * @example
   * ```typescript
   * const criteria: MetadataScraperFindCriteria = {
   *   source: 'https://youtube.com/watch?v=example',
   *   sourceUrl: 'https://youtube.com/watch?v=example',
   *   fileExtension: undefined,
   *   mimeType: undefined,
   *   isLocalFile: false
   * }
   *
   * const scraper = registry.findBestScraper(criteria)
   * if (scraper) {
   *   console.log(`Selected scraper: ${scraper.name}`)
   * }
   * ```
   * @internal
   */
  findBestScraper(criteria: MetadataScraperFindCriteria): MetadataScraperRegistration | null

  /**
   * Retrieves a specific registered scraper by its unique identifier.
   *
   * @param id - Unique identifier of the scraper to retrieve
   * @returns The scraper registration if found, null otherwise
   *
   * @example
   * ```typescript
   * const scraper = registry.getScraperById('youtube-scraper')
   * if (scraper) {
   *   console.log(`Found scraper: ${scraper.name}`)
   *   console.log(`Priority: ${scraper.priority}`)
   *   console.log(`Supported extensions: ${scraper.supportedExtensions.join(', ')}`)
   * }
   * ```
   * @internal
   */
  getScraperById(id: string): MetadataScraperRegistration | null

  /**
   * Returns an array of all currently registered scrapers.
   *
   * Useful for debugging, administration interfaces, or displaying
   * available capabilities to users.
   *
   * @returns Array containing all registered scraper registrations
   *
   * @example
   * ```typescript
   * const scrapers = registry.listRegisteredScrapers()
   * console.log(`Total scrapers: ${scrapers.length}`)
   *
   * scrapers.forEach(scraper => {
   *   console.log(`- ${scraper.name} (ID: ${scraper.id})`)
   *   console.log(`  Extensions: ${scraper.supportedExtensions.join(', ')}`)
   *   console.log(`  MIME types: ${scraper.supportedMimeTypes.join(', ')}`)
   *   console.log(`  Priority: ${scraper.priority || 0}`)
   * })
   * ```
   * @internal
   */
  listRegisteredScrapers(): MetadataScraperRegistration[]

  /**
   * Extracts metadata from a source using the most appropriate registered scraper.
   *
   * This is the main entry point for metadata extraction. The method:
   * 1. Analyzes the source to determine its characteristics
   * 2. Finds the best matching scraper using the scoring algorithm
   * 3. Invokes the scraper to extract metadata
   * 4. Returns the results in a standardized format
   *
   * The extracted metadata includes:
   * - Content type (video, document, image, etc.)
   * - Human-readable name/title
   * - Detected language
   * - Optional thumbnail image
   * - Source-specific additional metadata
   *
   * @param source - The source to extract metadata from (URL string, file path string, or File object)
   * @param context - Optional context information to assist with processing
   * @param context.originalPath - Original file path when source is processed or transformed
   * @param context.sourceUrl - Explicit source URL when source is ambiguous
   *
   * @returns Promise resolving to extraction results with success flag and metadata or error
   *
   * @example
   * ```typescript
   * // Extract from YouTube URL
   * const result = await registry.scrapeMetadata('https://youtube.com/watch?v=dQw4w9WgXcQ')
   * if (result.success) {
   *   console.log('Video title:', result.metadata.name)
   *   console.log('Language:', result.metadata.language)
   *   console.log('Additional info:', result.metadata.dynamicMetadata)
   * }
   *
   * // Extract from local file
   * const fileResult = await registry.scrapeMetadata('/path/to/document.pdf', {
   *   originalPath: '/path/to/document.pdf'
   * })
   *
   * // Extract from File object
   * const file = new File(['content'], 'document.txt', { type: 'text/plain' })
   * const fileObjResult = await registry.scrapeMetadata(file)
   *
   * // Handle extraction errors
   * if (!result.success) {
   *   console.error('Extraction failed:', result.error)
   *   // Fallback logic here
   * }
   * ```
   * @internal
   */
  scrapeMetadata(
    source: MetadataScraperSource,
    context?: {
      originalPath?: string
      sourceUrl?: string
    }
  ): Promise<{
    success: boolean
    metadata?: MetadataScraperResult
    error?: string
  }>
}

/* -------------------------------------------------------------------------- */
/*                             Plugin System Types                            */
/* -------------------------------------------------------------------------- */

/**
 * Plugin Manager interface defining the public API for managing community plugins
 * Responsible for the complete lifecycle of community plugins including discovery,
 * loading, dependency resolution, and runtime management.
 * @public
 */
export interface IPluginManager extends EventBus<PluginEvents> {
  /**
   * Initialize the plugin manager and load enabled plugins
   * This method sets up module resolution, discovers plugins, and loads enabled plugins
   * with proper dependency resolution.
   * @throws Error if initialization fails
   */
  initialize(): Promise<void>
  /**
   * Get a plugin instance by its ID
   * @param pluginId The unique identifier of the plugin
   * @returns The plugin instance if found and loaded, null otherwise
   */
  getPluginInstance(pluginId: string): IPlugin | null

  /**
   * Check if a plugin is currently enabled
   * @param pluginId The unique identifier of the plugin
   * @returns True if the plugin is enabled, false otherwise
   */
  isPluginEnabled(pluginId: string): boolean

  /**
   * Enable a plugin
   * Adds the plugin to the enabled set, saves configuration, and loads the plugin
   * if the plugin manager is already initialized.
   * @param pluginId The unique identifier of the plugin to enable
   * @throws Error if the plugin is not installed
   */
  enablePlugin(pluginId: string): Promise<void>

  /**
   * Disable a plugin
   * Removes the plugin from the enabled set, unloads it if active, and saves configuration.
   * May also disable dependent plugins if configured to do so.
   * @param pluginId The unique identifier of the plugin to disable
   */
  disablePlugin(pluginId: string): Promise<void>

  /**
   * List all discovered plugins with their current status
   * @returns Array of plugin information including manifest, enabled/loaded status, and any errors
   */
  listPlugins(): PluginInfo[]

  /**
   * Shutdown the plugin manager and unload all active plugins
   * Cleanly unloads all plugins and clears internal state.
   */
  shutdown(): Promise<void>

  /**
   * Refresh plugin discovery
   * Re-scans the plugins directory to discover newly installed plugins.
   * Useful for development and dynamic plugin installation.
   */
  refreshPlugins(): Promise<void>
}

//===============================================================================

export type { BasePlugin } from '@renderer/core/services/plugins/plugin'
export type { ContentAdapter } from '@renderer/core/services/content-adapter/content-adapter'
export type { MetadataScraper } from '@renderer/core/services/metadata-scraper/metadata-scraper'

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

/* -------------------------------------------------------------------------- */
/*                           Plugin UI System Types                          */
/* -------------------------------------------------------------------------- */

/**
 * Configuration for registering a plugin UI view
 * @public
 */
export interface PluginUIViewConfig {
  /** Unique identifier for this view within the plugin */
  id: string
  /** Display label for the view */
  label: string
  /** Icon class for the view */
  icon?: string
  /** Callback function that receives a DOM element to populate */
  onMount?: (element: HTMLDivElement) => void | Promise<void>
  /** Callback function called when the view is unmounted */
  onUnmount?: () => void | Promise<void>
  /** Whether this view can be closed by the user */
  closable?: boolean
  /** Whether this view should be the default active view for the plugin */
  isDefault?: boolean
  /** Optional context/state for the view */
  context?: Record<string, any>
}

/**
 * Internal representation of a registered plugin UI view
 * @public
 */
export interface RegisteredPluginView extends PluginUIViewConfig {
  pluginId: string
  isActive: boolean
  mountedComponent?: any
  lastActivated?: Date
}

/**
 * Events emitted by the Plugin UI Registry
 * @public
 */
export type PluginUIEvents = {
  'ui:registered': { pluginId: string; viewId: string; label: string }
  'ui:unregistered': { pluginId: string; viewId: string }
  'ui:activated': { pluginId: string; viewId: string }
  'ui:deactivated': { pluginId: string; viewId: string }
  'ui:error': { pluginId: string; viewId: string; error: string }
  'ui:token-click': { token: Token; block: TextBlock }
}

/**
 * Plugin UI Registry interface for managing plugin user interfaces
 * Similar to Obsidian's workspace API for plugins
 * @public
 */
export interface IPluginUIRegistry extends EventBus<PluginUIEvents> {
  /** Register a new UI view for a plugin */
  registerView(pluginId: string, config: PluginUIViewConfig): string

  /** Unregister a UI view */
  unregisterView(pluginId: string, viewId: string): boolean

  /** Unregister all views for a plugin */
  unregisterPluginViews(pluginId: string): number

  /** Activate a specific view by plugin ID and view ID */
  activateViewById(pluginId: string, viewId: string): boolean

  /** Deactivate the currently active view */
  deactivateCurrentView(): boolean

  /** Get the currently active view */
  getActiveView(): RegisteredPluginView | null

  /** Get all registered views */
  getAllViews(): RegisteredPluginView[]

  /** Get all views for a specific plugin */
  getPluginViews(pluginId: string): RegisteredPluginView[]

  /** Get a specific view */
  getView(pluginId: string, viewId: string): RegisteredPluginView | null

  /** Update view configuration */
  updateView(pluginId: string, viewId: string, updates: Partial<PluginUIViewConfig>): boolean

  /** Check if a view is registered */
  hasView(pluginId: string, viewId: string): boolean

  /** Get the reactive active view ref for components to watch */
  getActiveViewRef(): any // Ref<RegisteredPluginView | null> but avoiding Vue types

  /** Get the reactive views map for components to watch */
  getViewsRef(): any // Reactive map but avoiding Vue types

  /** Report an error for a specific view */
  reportViewError(pluginId: string, viewId: string, error: string): void

  /** Clean up all resources */
  destroy(): void
}

export type {
  Token,
  TokenizerRegistryFacade,
  TokenizerInfo,
  TokenizerFunction,
  TokenizerRegistration
} from '@shared/types/text-tokenizer-types'
