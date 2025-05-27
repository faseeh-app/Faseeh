import type {
  LibraryItem,
  NewLibraryItem,
  LibraryItemUpdate,
  PluginData,
  NewPluginData,
  PluginDataUpdate,
  AppSettings,
  NewAppSettings,
  AppSettingsUpdate,
  ContentGroup,
  NewContentGroup,
  ContentGroupUpdate,
  Collection,
  NewCollection,
  CollectionUpdate,
  CollectionMember,
  NewCollectionMember,
  CollectionMemberUpdate,
  VocabularyRegistry,
  NewVocabularyRegistry,
  VocabularyRegistryUpdate,
  VocabularySource,
  NewVocabularySource,
  VocabularySourceUpdate,
  EmbeddedAsset,
  NewEmbeddedAsset,
  EmbeddedAssetUpdate,
  SupplementaryFile,
  NewSupplementaryFile,
  SupplementaryFileUpdate
} from '@main/db/types'
import type { ContentDocument } from './content-document'

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
