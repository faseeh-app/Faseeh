import { ColumnType, Generated, Insertable, JSONColumnType, Selectable, Updateable } from 'kysely'

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

export type LibraryItem = Selectable<LibraryItemTable>
export type NewLibraryItem = Insertable<LibraryItemTable>
export type LibraryItemUpdate = Updateable<LibraryItemTable>

// PluginData Table
export interface PluginDataTable {
  id: Generated<number>
  pluginId: string
  key: string
  jsonData: JSONColumnType<any>
  libraryItemId: string | null
  createdAt: ColumnType<Date, string | undefined, never>
  updatedAt: ColumnType<Date, string | undefined, string | undefined>
}

export type PluginData = Selectable<PluginDataTable>
export type NewPluginData = Insertable<PluginDataTable>
export type PluginDataUpdate = Updateable<PluginDataTable>

// AppSettings Table
export interface AppSettingsTable {
  key: string // Primary key
  value: JSONColumnType<any>
  createdAt: ColumnType<Date, string | undefined, never>
  updatedAt: ColumnType<Date, string | undefined, string | undefined>
}

export type AppSettings = Selectable<AppSettingsTable>
export type NewAppSettings = Insertable<AppSettingsTable>
export type AppSettingsUpdate = Updateable<AppSettingsTable>

// ContentGroup Table
export interface ContentGroupTable {
  id: string
  type: string
  name: string
  dynamicMetadata: JSONColumnType<Record<string, any>>
  createdAt: ColumnType<Date, string | undefined, never>
  updatedAt: ColumnType<Date, string | undefined, string | undefined>
}

export type ContentGroup = Selectable<ContentGroupTable>
export type NewContentGroup = Insertable<ContentGroupTable>
export type ContentGroupUpdate = Updateable<ContentGroupTable>

// Collection Table
export interface CollectionTable {
  id: string
  name: string
  dynamicMetadata: JSONColumnType<Record<string, any>>
  createdAt: ColumnType<Date, string | undefined, never>
  updatedAt: ColumnType<Date, string | undefined, string | undefined>
}

export type Collection = Selectable<CollectionTable>
export type NewCollection = Insertable<CollectionTable>
export type CollectionUpdate = Updateable<CollectionTable>

// CollectionMember Table
export interface CollectionMemberTable {
  collectionId: string
  itemId: string
  itemType: string
  itemOrder: number
}

export type CollectionMember = Selectable<CollectionMemberTable>
export type NewCollectionMember = Insertable<CollectionMemberTable>
export type CollectionMemberUpdate = Updateable<CollectionMemberTable>

// VocabularyRegistry Table
export interface VocabularyRegistryTable {
  id: string
  text: string
  language: string
  createdAt: ColumnType<Date, string | undefined, never>
}

export type VocabularyRegistry = Selectable<VocabularyRegistryTable>
export type NewVocabularyRegistry = Insertable<VocabularyRegistryTable>
export type VocabularyRegistryUpdate = Updateable<VocabularyRegistryTable>

// VocabularySource Table
export interface VocabularySourceTable {
  vocabularyId: string
  libraryItemId: string
  contextSentence: string | null
  startOffset: number | null
  endOffset: number | null
  timestampMs: number | null
}

export type VocabularySource = Selectable<VocabularySourceTable>
export type NewVocabularySource = Insertable<VocabularySourceTable>
export type VocabularySourceUpdate = Updateable<VocabularySourceTable>

// EmbeddedAsset Table
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

export type EmbeddedAsset = Selectable<EmbeddedAssetTable>
export type NewEmbeddedAsset = Insertable<EmbeddedAssetTable>
export type EmbeddedAssetUpdate = Updateable<EmbeddedAssetTable>

// SupplementaryFile Table
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

export type SupplementaryFile = Selectable<SupplementaryFileTable>
export type NewSupplementaryFile = Insertable<SupplementaryFileTable>
export type SupplementaryFileUpdate = Updateable<SupplementaryFileTable>




