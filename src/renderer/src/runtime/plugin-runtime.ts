/**
 * Faseeh Plugin Runtime Exports
 *
 * This barrel file exports all the runtime code that plugins need access to.
 * Generated automatically from source code.
 * 
 * @generated 2025-06-10T13:52:11.799Z
 */

// Core Plugin Classes
export { BasePlugin } from '@renderer/core/services/plugins/base-plugin'

// Event System
export { workspaceEvents, storageEvents, pluginEvents } from '@shared/constants/event-emitters'
export { EventEmitterWrapper } from '@shared/utilities/event-system/event-emitter-wrapper'

// Storage Service
export { storage } from '@renderer/core/services/storage/storage-service'

// Type Re-exports (for runtime type checking if needed)
export type {
  PluginManifest,
  PluginInfo,
  FaseehApp,
  BasePlugin as IBasePlugin
} from '@shared/types/plugin-types'

export type {
  EventType,
  Handler,
  WildcardHandler,
  StorageEvents,
  WorkspaceEvents,
  PluginEvents
} from '@shared/types/event-types'

export type { IStorageAPI } from '@shared/types/storage-api'

// Content Document Types
export type {
  BoundingBox,
  BaseBlock,
  TextBlock,
  ImageBlock,
  VideoBlock,
  AudioBlock,
  ImageAnnotation,
  AnnotatedImageBlock,
  ContainerBlock,
  ContentBlock,
  ContentDocument
} from '@shared/types/content-document'

// Database Entity Types
export type {
  LibraryItem,
  PluginData,
  AppSettings,
  ContentGroup,
  Collection,
  CollectionMember,
  VocabularyRegistry,
  VocabularySource,
  EmbeddedAsset,
  SupplementaryFile,
  NewLibraryItem,
  NewPluginData,
  NewAppSettings,
  NewContentGroup,
  NewCollection,
  NewCollectionMember,
  NewVocabularyRegistry,
  NewVocabularySource,
  NewEmbeddedAsset,
  NewSupplementaryFile,
  LibraryItemUpdate,
  PluginDataUpdate,
  AppSettingsUpdate,
  ContentGroupUpdate,
  CollectionUpdate,
  CollectionMemberUpdate,
  VocabularyRegistryUpdate,
  VocabularySourceUpdate,
  EmbeddedAssetUpdate,
  SupplementaryFileUpdate
} from '@main/db/types'

// Import required dependencies for createFaseehApp
import { storage } from '@renderer/core/services/storage/storage-service'
import { workspaceEvents, storageEvents, pluginEvents } from '@shared/constants/event-emitters'
import type { FaseehApp } from '@shared/types/plugin-types'

/**
 * Creates the FaseehApp object that plugins receive
 */
export function createFaseehApp(): FaseehApp {
  return {
    appInfo: {
      version: '1.0.0', // TODO: Get from package.json or build config
      platform: (typeof window !== 'undefined' ? 'win' : 'linux') as 'win' | 'mac' | 'linux'
    },
    storage,
    plugins: {
      getPlugin: (_id: string) => null // TODO: Implement plugin registry lookup
    },
    workspaceEvents,
    storageEvents,
    pluginEvents
  }
}
