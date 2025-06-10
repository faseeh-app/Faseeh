import { ColumnType, Generated, Insertable, JSONColumnType, Selectable, Updateable } from 'kysely'

/**
 * @public
 */
export interface Database {
  libraryItems: LibraryItemTable
  pluginData: PluginDataTable
  appSettings: AppSettingsTable
  contentGroups: ContentGroupTable
  collections: CollectionTable
  collectionMembers: CollectionMemberTable
  vocabularyRegistry: VocabularyRegistryTable
  vocabularySources: VocabularySourceTable
  embeddedAssets: EmbeddedAssetTable
  supplementaryFiles: SupplementaryFileTable
}

// LibraryItem Table
/**
 * @public
 */
export interface LibraryItemTable {
  id: string
  type: string
  name: string | null
  language: string | null
  sourceUri: string | null
  storagePath: string | null
  contentDocumentPath: string | null
  contentGroupId: string | null
  groupOrder: number | null
  dynamicMetadata: JSONColumnType<Record<string, any>>
  createdAt: ColumnType<Date, string | undefined, never>
  updatedAt: ColumnType<Date, string | undefined, string | undefined>
}

/**
 * @public
 */
export type LibraryItem = Selectable<LibraryItemTable>
/**
 * @public
 */
export type NewLibraryItem = Insertable<LibraryItemTable>
/**
 * @public
 */
export type LibraryItemUpdate = Updateable<LibraryItemTable>

// PluginData Table
/**
 * @public
 */
export interface PluginDataTable {
  id: Generated<number>
  pluginId: string
  key: string
  jsonData: JSONColumnType<any>
  libraryItemId: string | null
  createdAt: ColumnType<Date, string | undefined, never>
  updatedAt: ColumnType<Date, string | undefined, string | undefined>
}

/**
 * @public
 */
export type PluginData = Selectable<PluginDataTable>
/**
 * @public
 */
export type NewPluginData = Insertable<PluginDataTable>
/**
 * @public
 */
export type PluginDataUpdate = Updateable<PluginDataTable>

// AppSettings Table
/**
 * @public
 */
export interface AppSettingsTable {
  key: string // Primary key
  value: JSONColumnType<any>
  createdAt: ColumnType<Date, string | undefined, never>
  updatedAt: ColumnType<Date, string | undefined, string | undefined>
}

/**
 * @public
 */
export type AppSettings = Selectable<AppSettingsTable>
/**
 * @public
 */
export type NewAppSettings = Insertable<AppSettingsTable>
/**
 * @public
 */
export type AppSettingsUpdate = Updateable<AppSettingsTable>

// ContentGroup Table
/**
 * @public
 */
export interface ContentGroupTable {
  id: string
  type: string
  name: string
  dynamicMetadata: JSONColumnType<Record<string, any>>
  createdAt: ColumnType<Date, string | undefined, never>
  updatedAt: ColumnType<Date, string | undefined, string | undefined>
}

/**
 * @public
 */
export type ContentGroup = Selectable<ContentGroupTable>
/**
 * @public
 */
export type NewContentGroup = Insertable<ContentGroupTable>
/**
 * @public
 */
export type ContentGroupUpdate = Updateable<ContentGroupTable>

// Collection Table
/**
 * @public
 */
export interface CollectionTable {
  id: string
  name: string
  dynamicMetadata: JSONColumnType<Record<string, any>>
  createdAt: ColumnType<Date, string | undefined, never>
  updatedAt: ColumnType<Date, string | undefined, string | undefined>
}

/**
 * @public
 */
export type Collection = Selectable<CollectionTable>
/**
 * @public
 */
export type NewCollection = Insertable<CollectionTable>
/**
 * @public
 */
export type CollectionUpdate = Updateable<CollectionTable>

// CollectionMember Table
/**
 * @public
 */
export interface CollectionMemberTable {
  collectionId: string
  itemId: string
  itemType: string
  itemOrder: number
}

/**
 * @public
 */
export type CollectionMember = Selectable<CollectionMemberTable>
/**
 * @public
 */
export type NewCollectionMember = Insertable<CollectionMemberTable>
/**
 * @public
 */
export type CollectionMemberUpdate = Updateable<CollectionMemberTable>

// VocabularyRegistry Table
/**
 * @public
 */
export interface VocabularyRegistryTable {
  id: string
  text: string
  language: string
  createdAt: ColumnType<Date, string | undefined, never>
}

/**
 * @public
 */
export type VocabularyRegistry = Selectable<VocabularyRegistryTable>
/**
 * @public
 */
export type NewVocabularyRegistry = Insertable<VocabularyRegistryTable>
/**
 * @public
 */
export type VocabularyRegistryUpdate = Updateable<VocabularyRegistryTable>

// VocabularySource Table
/**
 * @public
 */
export interface VocabularySourceTable {
  vocabularyId: string
  libraryItemId: string
  contextSentence: string | null
  startOffset: number | null
  endOffset: number | null
  timestampMs: number | null
}

/**
 * @public
 */
export type VocabularySource = Selectable<VocabularySourceTable>
/**
 * @public
 */
export type NewVocabularySource = Insertable<VocabularySourceTable>
/**
 * @public
 */
export type VocabularySourceUpdate = Updateable<VocabularySourceTable>

// EmbeddedAsset Table
/**
 * @public
 */
export interface EmbeddedAssetTable {
  id: string
  libraryItemId: string
  storagePath: string
  format: string | null
  originalSrc: string | null
  width: number | null
  height: number | null
  sizeBytes: number | null
  checksum: string | null
  createdAt: ColumnType<Date, string | undefined, never>
}

/**
 * @public
 */
export type EmbeddedAsset = Selectable<EmbeddedAssetTable>
/**
 * @public
 */
export type NewEmbeddedAsset = Insertable<EmbeddedAssetTable>
/**
 * @public
 */
export type EmbeddedAssetUpdate = Updateable<EmbeddedAssetTable>

// SupplementaryFile Table
/**
 * @public
 */
export interface SupplementaryFileTable {
  id: string
  libraryItemId: string
  type: string
  storagePath: string
  format: string | null
  language: string | null
  filename: string | null
  sizeBytes: number | null
  checksum: string | null
  createdAt: ColumnType<Date, string | undefined, never>
}

/**
 * @public
 */
export type SupplementaryFile = Selectable<SupplementaryFileTable>
/**
 * @public
 */
export type NewSupplementaryFile = Insertable<SupplementaryFileTable>
/**
 * @public
 */
export type SupplementaryFileUpdate = Updateable<SupplementaryFileTable>

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

import type { PluginInfo } from './plugin-types'
import type { EventEmitterWrapper } from '@shared/utilities/event-system/event-emitter-wrapper'

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
import type { EventEmitterWrapper } from '@shared/utilities/event-system/event-emitter-wrapper'
import { EventType, Handler } from '@root/src/shared/types'
import {
  EventType,
  Handler,
  PluginEvents,
  StorageEvents,
  WorkspaceEvents
} from '@root/src/shared/types'
import { IStorageAPI } from '@root/src/shared/types'

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
  storage: IStorageAPI

  /** Access to other plugins */
  plugins: {
    getPlugin(id: string): BasePlugin | null
  }

  // Shared event emitters
  workspaceEvents: EventEmitterWrapper<WorkspaceEvents>
  storageEvents: EventEmitterWrapper<StorageEvents>
  pluginEvents: EventEmitterWrapper<PluginEvents>
}

/**
 * BasePlugin abstract class interface that all plugins must implement
 * @public
 */
export interface BasePlugin {
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

  // --- Internal Methods ---

  /** Internal method to clean up all registered listeners */
  _cleanupListeners(): void
}

/* -------------------------------------------------------------------------- */
/*                                Storage Types                               */
/* -------------------------------------------------------------------------- */

/**
 * @public
 */
export interface IStorageAPI {
  // == Path Management ==
  getFaseehFolderPath: () => Promise<string>
  getLibraryItemDirectoryPath: (libraryItemId: string) => Promise<string | undefined>
  getEmbeddedAssetAbsolutePath: (assetId: string) => Promise<string | undefined>
  getSupplementaryFileAbsolutePath: (fileId: string) => Promise<string | undefined>
  getPluginDirectoryPath: (pluginId: string) => Promise<string | undefined>
  listPluginDirectories: () => Promise<string[]>
  getConfigDirectoryPath: () => Promise<string | undefined>

  // == LibraryItems & Document.json ==
  getLibraryItems: (criteria?: Partial<LibraryItem>) => Promise<LibraryItem[]>
  getLibraryItemById: (id: string) => Promise<LibraryItem | undefined>
  createLibraryItem: (
    item: NewLibraryItem,
    documentContent?: ContentDocument
  ) => Promise<LibraryItem | undefined>
  updateLibraryItem: (id: string, itemUpdate: LibraryItemUpdate) => Promise<LibraryItem | undefined>
  deleteLibraryItem: (id: string) => Promise<boolean>
  getDocumentJson: (libraryItemId: string) => Promise<ContentDocument | undefined>
  saveDocumentJson: (libraryItemId: string, content: ContentDocument) => Promise<boolean>

  // == PluginData (Database) ==
  getPluginDataEntries: (
    pluginId: string,
    key?: string,
    libraryItemId?: string | null
  ) => Promise<PluginData[]>
  getPluginDataEntryById: (id: number) => Promise<PluginData | undefined>
  createPluginDataEntry: (data: NewPluginData) => Promise<PluginData | undefined>
  updatePluginDataEntry: (
    id: number,
    dataUpdate: PluginDataUpdate
  ) => Promise<PluginData | undefined>
  deletePluginDataEntry: (id: number) => Promise<boolean>
  deletePluginDataEntriesByKey: (
    pluginId: string,
    key: string,
    libraryItemId?: string | null
  ) => Promise<number>

  // == Plugin File Data (Filesystem) ==
  readPluginManifest: (pluginId: string) => Promise<PluginManifest | undefined>
  readPluginDataFile: (pluginId: string, relativePath: string) => Promise<string | undefined>
  writePluginDataFile: (pluginId: string, relativePath: string, content: string) => Promise<boolean>
  deletePluginDataFile: (pluginId: string, relativePath: string) => Promise<boolean>
  listPluginDataFiles: (pluginId: string, subDirectory?: string) => Promise<string[]>

  // == AppSettings (Database - for settings.json like data) ==
  getAppSetting: (key: string) => Promise<AppSettings | undefined>
  getAllAppSettings: () => Promise<AppSettings[]>
  setAppSetting: (setting: NewAppSettings | AppSettingsUpdate) => Promise<AppSettings | undefined>
  deleteAppSetting: (key: string) => Promise<boolean>

  // == Specific Config Files (Filesystem) ==
  getEnabledPluginIds: () => Promise<string[]>
  setEnabledPluginIds: (pluginIds: string[]) => Promise<boolean>

  // == ContentGroups ==
  getContentGroups: () => Promise<ContentGroup[]>
  getContentGroupById: (id: string) => Promise<ContentGroup | undefined>
  createContentGroup: (group: NewContentGroup) => Promise<ContentGroup | undefined>
  updateContentGroup: (
    id: string,
    groupUpdate: ContentGroupUpdate
  ) => Promise<ContentGroup | undefined>
  deleteContentGroup: (id: string) => Promise<boolean>

  // == Collections ==
  getCollections: () => Promise<Collection[]>
  getCollectionById: (id: string) => Promise<Collection | undefined>
  createCollection: (collection: NewCollection) => Promise<Collection | undefined>
  updateCollection: (
    id: string,
    collectionUpdate: CollectionUpdate
  ) => Promise<Collection | undefined>
  deleteCollection: (id: string) => Promise<boolean>

  // == CollectionMembers ==
  getCollectionMembers: (collectionId: string) => Promise<CollectionMember[]>
  getCollectionsForMember: (itemId: string, itemType: string) => Promise<CollectionMember[]>
  addCollectionMember: (member: NewCollectionMember) => Promise<CollectionMember | undefined>
  updateCollectionMemberOrder: (
    collectionId: string,
    itemId: string,
    itemType: string,
    newOrder: number
  ) => Promise<boolean>
  removeCollectionMember: (
    collectionId: string,
    itemId: string,
    itemType: string
  ) => Promise<boolean>

  // == VocabularyRegistry ==
  getVocabularyEntries: (language?: string, text?: string) => Promise<VocabularyRegistry[]>
  getVocabularyEntryById: (id: string) => Promise<VocabularyRegistry | undefined>
  findOrCreateVocabularyEntry: (
    entry: Pick<NewVocabularyRegistry, 'text' | 'language'>
  ) => Promise<VocabularyRegistry | undefined>
  updateVocabularyEntry: (
    id: string,
    entryUpdate: VocabularyRegistryUpdate
  ) => Promise<VocabularyRegistry | undefined>
  deleteVocabularyEntry: (id: string) => Promise<boolean>

  // == VocabularySources ==
  getVocabularySources: (filters: {
    vocabularyId?: string
    libraryItemId?: string
  }) => Promise<VocabularySource[]>
  addVocabularySource: (source: NewVocabularySource) => Promise<VocabularySource | undefined>
  deleteVocabularySources: (
    criteria: Partial<Pick<VocabularySource, 'vocabularyId' | 'libraryItemId'>>
  ) => Promise<number>

  // == EmbeddedAssets ==
  getEmbeddedAssetsByLibraryItem: (libraryItemId: string) => Promise<EmbeddedAsset[]>
  getEmbeddedAssetById: (id: string) => Promise<EmbeddedAsset | undefined>
  createEmbeddedAsset: (asset: NewEmbeddedAsset) => Promise<EmbeddedAsset | undefined>
  updateEmbeddedAsset: (
    id: string,
    assetUpdate: EmbeddedAssetUpdate
  ) => Promise<EmbeddedAsset | undefined>
  deleteEmbeddedAsset: (id: string) => Promise<boolean>

  // == SupplementaryFiles ==
  getSupplementaryFilesByLibraryItem: (
    libraryItemId: string,
    type?: string,
    language?: string
  ) => Promise<SupplementaryFile[]>
  getSupplementaryFileById: (id: string) => Promise<SupplementaryFile | undefined>
  createSupplementaryFile: (file: NewSupplementaryFile) => Promise<SupplementaryFile | undefined>
  updateSupplementaryFile: (
    id: string,
    fileUpdate: SupplementaryFileUpdate
  ) => Promise<SupplementaryFile | undefined>
  deleteSupplementaryFile: (id: string) => Promise<boolean>
}
