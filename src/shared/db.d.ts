import { ColumnType, Generated, Insertable, JSONColumnType, Selectable, Updateable } from 'kysely'

/**
 * @internal
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
 * @internal
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
 * @internal
 */
export type LibraryItem = Selectable<LibraryItemTable>
/**
 * @internal
 */
export type NewLibraryItem = Insertable<LibraryItemTable>
/**
 * @internal
 */
export type LibraryItemUpdate = Updateable<LibraryItemTable>

// PluginData Table
/**
 * @internal
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
 * @internal
 */
export type PluginData = Selectable<PluginDataTable>
/**
 * @internal
 */
export type NewPluginData = Insertable<PluginDataTable>
/**
 * @internal
 */
export type PluginDataUpdate = Updateable<PluginDataTable>

// AppSettings Table
/**
 * @internal
 */
export interface AppSettingsTable {
  key: string // Primary key
  value: JSONColumnType<any>
  createdAt: ColumnType<Date, string | undefined, never>
  updatedAt: ColumnType<Date, string | undefined, string | undefined>
}

/**
 * @internal
 */
export type AppSettings = Selectable<AppSettingsTable>
/**
 * @internal
 */
export type NewAppSettings = Insertable<AppSettingsTable>
/**
 * @internal
 */
export type AppSettingsUpdate = Updateable<AppSettingsTable>

// ContentGroup Table
/**
 * @internal
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
 * @internal
 */
export type ContentGroup = Selectable<ContentGroupTable>
/**
 * @internal
 */
export type NewContentGroup = Insertable<ContentGroupTable>
/**
 * @internal
 */
export type ContentGroupUpdate = Updateable<ContentGroupTable>

// Collection Table
/**
 * @internal
 */
export interface CollectionTable {
  id: string
  name: string
  dynamicMetadata: JSONColumnType<Record<string, any>>
  createdAt: ColumnType<Date, string | undefined, never>
  updatedAt: ColumnType<Date, string | undefined, string | undefined>
}

/**
 * @internal
 */
export type Collection = Selectable<CollectionTable>
/**
 * @internal
 */
export type NewCollection = Insertable<CollectionTable>
/**
 * @internal
 */
export type CollectionUpdate = Updateable<CollectionTable>

// CollectionMember Table
/**
 * @internal
 */
export interface CollectionMemberTable {
  collectionId: string
  itemId: string
  itemType: string
  itemOrder: number
}

/**
 * @internal
 */
export type CollectionMember = Selectable<CollectionMemberTable>
/**
 * @internal
 */
export type NewCollectionMember = Insertable<CollectionMemberTable>
/**
 * @internal
 */
export type CollectionMemberUpdate = Updateable<CollectionMemberTable>

// VocabularyRegistry Table
/**
 * @internal
 */
export interface VocabularyRegistryTable {
  id: string
  text: string
  language: string
  createdAt: ColumnType<Date, string | undefined, never>
}

/**
 * @internal
 */
export type VocabularyRegistry = Selectable<VocabularyRegistryTable>
/**
 * @internal
 */
export type NewVocabularyRegistry = Insertable<VocabularyRegistryTable>
/**
 * @internal
 */
export type VocabularyRegistryUpdate = Updateable<VocabularyRegistryTable>

// VocabularySource Table
/**
 * @internal
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
 * @internal
 */
export type VocabularySource = Selectable<VocabularySourceTable>
/**
 * @internal
 */
export type NewVocabularySource = Insertable<VocabularySourceTable>
/**
 * @internal
 */
export type VocabularySourceUpdate = Updateable<VocabularySourceTable>

// EmbeddedAsset Table
/**
 * @internal
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
 * @internal
 */
export type EmbeddedAsset = Selectable<EmbeddedAssetTable>
/**
 * @internal
 */
export type NewEmbeddedAsset = Insertable<EmbeddedAssetTable>
/**
 * @internal
 */
export type EmbeddedAssetUpdate = Updateable<EmbeddedAssetTable>

// SupplementaryFile Table
/**
 * @internal
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
 * @internal
 */
export type SupplementaryFile = Selectable<SupplementaryFileTable>
/**
 * @internal
 */
export type NewSupplementaryFile = Insertable<SupplementaryFileTable>
/**
 * @internal
 */
export type SupplementaryFileUpdate = Updateable<SupplementaryFileTable>