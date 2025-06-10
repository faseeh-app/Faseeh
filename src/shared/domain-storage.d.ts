
/* -------------------------------------------------------------------------- */
/*                         Domain Storage Types                               */
/* -------------------------------------------------------------------------- */

/**
 * @public
 */
export interface IStorage {
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
    item: CreateLibraryItemDTO,
    documentContent?: ContentDocument
  ) => Promise<LibraryItem | undefined>
  updateLibraryItem: (
    id: string,
    itemUpdate: UpdateLibraryItemDTO
  ) => Promise<LibraryItem | undefined>
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
  createPluginDataEntry: (data: CreatePluginDataDTO) => Promise<PluginData | undefined>
  updatePluginDataEntry: (
    id: number,
    dataUpdate: UpdatePluginDataDTO
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
  getAppSetting: (key: string) => Promise<AppSetting | undefined>
  getAllAppSettings: () => Promise<AppSetting[]>
  setAppSetting: (
    setting: CreateAppSettingDTO | UpdateAppSettingDTO
  ) => Promise<AppSetting | undefined>
  deleteAppSetting: (key: string) => Promise<boolean>

  // == Specific Config Files (Filesystem) ==
  getEnabledPluginIds: () => Promise<string[]>
  setEnabledPluginIds: (pluginIds: string[]) => Promise<boolean>

  // == ContentGroups ==
  getContentGroups: () => Promise<ContentGroup[]>
  getContentGroupById: (id: string) => Promise<ContentGroup | undefined>
  createContentGroup: (group: CreateContentGroupDTO) => Promise<ContentGroup | undefined>
  updateContentGroup: (
    id: string,
    groupUpdate: UpdateContentGroupDTO
  ) => Promise<ContentGroup | undefined>
  deleteContentGroup: (id: string) => Promise<boolean>

  // == Collections ==
  getCollections: () => Promise<Collection[]>
  getCollectionById: (id: string) => Promise<Collection | undefined>
  createCollection: (collection: CreateCollectionDTO) => Promise<Collection | undefined>
  updateCollection: (
    id: string,
    collectionUpdate: UpdateCollectionDTO
  ) => Promise<Collection | undefined>
  deleteCollection: (id: string) => Promise<boolean>

  // == CollectionMembers ==
  getCollectionMembers: (collectionId: string) => Promise<CollectionMember[]>
  getCollectionsForMember: (itemId: string, itemType: string) => Promise<CollectionMember[]>
  addCollectionMember: (member: CreateCollectionMemberDTO) => Promise<CollectionMember | undefined>
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
  getVocabularyEntries: (language?: string, text?: string) => Promise<VocabularyEntry[]>
  getVocabularyEntryById: (id: string) => Promise<VocabularyEntry | undefined>
  findOrCreateVocabularyEntry: (
    entry: Pick<CreateVocabularyEntryDTO, 'text' | 'language'>
  ) => Promise<VocabularyEntry | undefined>
  updateVocabularyEntry: (
    id: string,
    entryUpdate: UpdateVocabularyEntryDTO
  ) => Promise<VocabularyEntry | undefined>
  deleteVocabularyEntry: (id: string) => Promise<boolean>

  // == VocabularySources ==
  getVocabularySources: (filters: {
    vocabularyId?: string
    libraryItemId?: string
  }) => Promise<VocabularySource[]>
  addVocabularySource: (source: CreateVocabularySourceDTO) => Promise<VocabularySource | undefined>
  deleteVocabularySources: (
    criteria: Partial<Pick<VocabularySource, 'vocabularyId' | 'libraryItemId'>>
  ) => Promise<number>

  // == EmbeddedAssets ==
  getEmbeddedAssetsByLibraryItem: (libraryItemId: string) => Promise<EmbeddedAsset[]>
  getEmbeddedAssetById: (id: string) => Promise<EmbeddedAsset | undefined>
  createEmbeddedAsset: (asset: CreateEmbeddedAssetDTO) => Promise<EmbeddedAsset | undefined>
  updateEmbeddedAsset: (
    id: string,
    assetUpdate: UpdateEmbeddedAssetDTO
  ) => Promise<EmbeddedAsset | undefined>
  deleteEmbeddedAsset: (id: string) => Promise<boolean>

  // == SupplementaryFiles ==
  getSupplementaryFilesByLibraryItem: (
    libraryItemId: string,
    type?: string,
    language?: string
  ) => Promise<SupplementaryFile[]>
  getSupplementaryFileById: (id: string) => Promise<SupplementaryFile | undefined>
  createSupplementaryFile: (
    file: CreateSupplementaryFileDTO
  ) => Promise<SupplementaryFile | undefined>
  updateSupplementaryFile: (
    id: string,
    fileUpdate: UpdateSupplementaryFileDTO
  ) => Promise<SupplementaryFile | undefined>
  deleteSupplementaryFile: (id: string) => Promise<boolean>
}
