import { ContentDocument } from '@shared/types'
/* -------------------------------------------------------------------------- */
/*                                Domain Models                               */
/* -------------------------------------------------------------------------- */

// Core Library Models
/**
 * @public
 */
export interface LibraryItem {
  id: string
  type: string
  name?: string
  language?: string
  sourceUri?: string
  storagePath?: string
  contentDocumentPath?: string
  document?: ContentDocument
  contentGroupId?: string
  groupOrder?: number
  dynamicMetadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

/**
 * @public
 */
export interface ContentGroup {
  id: string
  type: string
  name: string
  dynamicMetadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

// Collection Models
/**
 * @public
 */
export interface Collection {
  id: string
  name: string
  dynamicMetadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

/**
 * @public
 */
export interface CollectionMember {
  collectionId: string
  itemId: string
  itemType: string
  itemOrder: number
}

// Vocabulary Models
/**
 * @public
 */
export interface VocabularyEntry {
  id: string
  text: string
  language: string
  createdAt: Date
}

/**
 * @public
 */
export interface VocabularySource {
  vocabularyId: string
  libraryItemId: string
  contextSentence?: string
  startOffset?: number
  endOffset?: number
  timestampMs?: number
}

// Asset Models
/**
 * @public
 */
export interface EmbeddedAsset {
  id: string
  libraryItemId: string
  storagePath: string
  format?: string
  originalSrc?: string
  width?: number
  height?: number
  sizeBytes?: number
  checksum?: string
  createdAt: Date
}

/**
 * @public
 */
export interface SupplementaryFile {
  id: string
  libraryItemId: string
  type: string
  storagePath: string
  format?: string
  language?: string
  filename?: string
  sizeBytes?: number
  checksum?: string
  createdAt: Date
}

// System Models
/**
 * @public
 */
export interface AppSetting {
  key: string
  value: any
  createdAt: Date
  updatedAt: Date
}

/**
 * @public
 */
export interface PluginData {
  id: number
  pluginId: string
  key: string
  jsonData: string
  libraryItemId?: string
  createdAt: Date
  updatedAt: Date
}

// Create and Update DTOs
/**
 * @public
 */
export interface CreateLibraryItemDTO {
  id?: string
  type: string
  name?: string
  language?: string
  sourceUri?: string
  storagePath?: string
  contentDocumentPath?: string
  contentGroupId?: string
  groupOrder?: number
  dynamicMetadata?: Record<string, any>
}

/**
 * @public
 */
export interface UpdateLibraryItemDTO {
  type?: string
  name?: string
  language?: string
  sourceUri?: string
  storagePath?: string
  contentDocumentPath?: string
  contentGroupId?: string
  groupOrder?: number
  dynamicMetadata?: Record<string, any>
}

/**
 * @public
 */
export interface CreateContentGroupDTO {
  id?: string
  type: string
  name: string
  dynamicMetadata?: Record<string, any>
}

/**
 * @public
 */
export interface UpdateContentGroupDTO {
  type?: string
  name?: string
  dynamicMetadata?: Record<string, any>
}

/**
 * @public
 */
export interface CreateCollectionDTO {
  id?: string
  name: string
  dynamicMetadata?: Record<string, any>
}

/**
 * @public
 */
export interface UpdateCollectionDTO {
  name?: string
  dynamicMetadata?: Record<string, any>
}

/**
 * @public
 */
export interface CreateCollectionMemberDTO {
  collectionId: string
  itemId: string
  itemType: string
  itemOrder?: number
}

/**
 * @public
 */
export interface UpdateCollectionMemberDTO {
  itemOrder?: number
}

/**
 * @public
 */
export interface CreateVocabularyEntryDTO {
  id?: string
  text: string
  language: string
}

/**
 * @public
 */
export interface UpdateVocabularyEntryDTO {
  text?: string
  language?: string
}

/**
 * @public
 */
export interface CreateVocabularySourceDTO {
  vocabularyId: string
  libraryItemId: string
  contextSentence?: string
  startOffset?: number
  endOffset?: number
  timestampMs?: number
}

/**
 * @public
 */
export interface CreateEmbeddedAssetDTO {
  id?: string
  libraryItemId: string
  storagePath: string
  format?: string
  originalSrc?: string
  width?: number
  height?: number
  sizeBytes?: number
  checksum?: string
}

/**
 * @public
 */
export interface UpdateEmbeddedAssetDTO {
  storagePath?: string
  format?: string
  originalSrc?: string
  width?: number
  height?: number
  sizeBytes?: number
  checksum?: string
}

/**
 * @public
 */
export interface CreateSupplementaryFileDTO {
  id?: string
  libraryItemId: string
  type: string
  storagePath: string
  format?: string
  language?: string
  filename?: string
  sizeBytes?: number
  checksum?: string
}

/**
 * @public
 */
export interface UpdateSupplementaryFileDTO {
  type?: string
  storagePath?: string
  format?: string
  language?: string
  filename?: string
  sizeBytes?: number
  checksum?: string
}

/**
 * @public
 */
export interface CreateAppSettingDTO {
  key: string
  value: string
}

/**
 * @public
 */
export interface UpdateAppSettingDTO {
  value: string
}

/**
 * @public
 */
export interface CreatePluginDataDTO {
  pluginId: string
  key: string
  jsonData: string
  libraryItemId?: string
}

/**
 * @public
 */
export interface UpdatePluginDataDTO {
  key?: string
  jsonData?: string
  libraryItemId?: string
}

// Enum types for common fields
/**
 * @public
 */
export enum LibraryItemType {
  BOOK = 'book',
  ARTICLE = 'article',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  WEBPAGE = 'webpage'
}

/**
 * @public
 */
export enum ContentGroupType {
  SERIES = 'series',
  COURSE = 'course',
  COLLECTION = 'collection',
  CATEGORY = 'category'
}

/**
 * @public
 */
export enum CollectionMemberType {
  LIBRARY_ITEM = 'library_item',
  CONTENT_GROUP = 'content_group'
}

/**
 * @public
 */
export enum SupplementaryFileType {
  SUBTITLE = 'subtitle',
  TRANSCRIPT = 'transcript',
  NOTES = 'notes',
  TRANSLATION = 'translation',
  METADATA = 'metadata'
}

/**
 * @public
 */
export interface PaginationOptions {
  page?: number
  limit?: number
  offset?: number
}

/**
 * @public
 */
export interface SortOptions {
  field: string
  direction: 'asc' | 'desc'
}

/**
 * @public
 */
export interface FilterOptions {
  [key: string]: any
}

/**
 * @public
 */
export interface QueryOptions {
  pagination?: PaginationOptions
  sort?: SortOptions
  filter?: FilterOptions
}

/**
 * @public
 */
export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  hasPrevious: boolean
}
