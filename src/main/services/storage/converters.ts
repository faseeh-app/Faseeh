import type {
  LibraryItem as DbLibraryItem,
  NewLibraryItem as DbNewLibraryItem,
  LibraryItemUpdate as DbLibraryItemUpdate,
  ContentGroup as DbContentGroup,
  NewContentGroup as DbNewContentGroup,
  ContentGroupUpdate as DbContentGroupUpdate,
  Collection as DbCollection,
  NewCollection as DbNewCollection,
  CollectionUpdate as DbCollectionUpdate,
  CollectionMember as DbCollectionMember,
  NewCollectionMember as DbNewCollectionMember,
  CollectionMemberUpdate as DbCollectionMemberUpdate,
  VocabularyRegistry as DbVocabularyRegistry,
  NewVocabularyRegistry as DbNewVocabularyRegistry,
  VocabularyRegistryUpdate as DbVocabularyRegistryUpdate,
  VocabularySource as DbVocabularySource,
  NewVocabularySource as DbNewVocabularySource,
  EmbeddedAsset as DbEmbeddedAsset,
  NewEmbeddedAsset as DbNewEmbeddedAsset,
  EmbeddedAssetUpdate as DbEmbeddedAssetUpdate,
  SupplementaryFile as DbSupplementaryFile,
  NewSupplementaryFile as DbNewSupplementaryFile,
  SupplementaryFileUpdate as DbSupplementaryFileUpdate,
  PluginData as DbPluginData,
  NewPluginData as DbNewPluginData,
  PluginDataUpdate as DbPluginDataUpdate,
  AppSettings as DbAppSettings,
  NewAppSettings as DbNewAppSettings,
  AppSettingsUpdate as DbAppSettingsUpdate
} from '@root/src/shared/db'

import type {
  LibraryItem,
  CreateLibraryItemDTO,
  UpdateLibraryItemDTO,
  ContentGroup,
  CreateContentGroupDTO,
  UpdateContentGroupDTO,
  Collection,
  CreateCollectionDTO,
  UpdateCollectionDTO,
  CollectionMember,
  CreateCollectionMemberDTO,
  UpdateCollectionMemberDTO,
  VocabularyEntry,
  CreateVocabularyEntryDTO,
  UpdateVocabularyEntryDTO,
  VocabularySource,
  CreateVocabularySourceDTO,
  EmbeddedAsset,
  CreateEmbeddedAssetDTO,
  UpdateEmbeddedAssetDTO,
  SupplementaryFile,
  CreateSupplementaryFileDTO,
  UpdateSupplementaryFileDTO,
  PluginData,
  CreatePluginDataDTO,
  UpdatePluginDataDTO,
  AppSetting,
  CreateAppSettingDTO,
  UpdateAppSettingDTO
} from '@root/src/shared/models'

/* -------------------------------------------------------------------------- */
/*                               Generic Utils                               */
/* -------------------------------------------------------------------------- */

// Generic converter for converting arrays
const convertArray = <TDb, TDomain>(dbItems: TDb[], converter: (item: TDb) => TDomain): TDomain[] =>
  dbItems.map(converter)

// Helper to convert dates from ISO strings to Date objects
const parseDate = (dateStr: string | Date): Date =>
  typeof dateStr === 'string' ? new Date(dateStr) : dateStr

// Helper to generate IDs for create DTOs that don't have them
const ensureId = (dto: { id?: string }, fallback: () => string): string => dto.id || fallback()

// Helper to handle JSON data - database stores as JSON string, domain expects object
const parseJsonData = (jsonData: any): any => {
  if (typeof jsonData === 'string') {
    try {
      return JSON.parse(jsonData)
    } catch {
      return {}
    }
  }
  return jsonData || {}
}

// Helper to stringify JSON data for database storage
const stringifyJsonData = (data: any): any => {
  if (typeof data === 'object' && data !== null) {
    return data // Kysely handles JSON serialization automatically
  }
  return data || {}
}

/* -------------------------------------------------------------------------- */
/*                             LibraryItem Converters                        */
/* -------------------------------------------------------------------------- */

export const toLibraryItemDomain = (db: DbLibraryItem): LibraryItem => ({
  id: db.id,
  type: db.type,
  name: db.name ?? undefined,
  language: db.language ?? undefined,
  sourceUri: db.sourceUri ?? undefined,
  storagePath: db.storagePath ?? undefined,
  contentDocumentPath: db.contentDocumentPath ?? undefined,
  contentGroupId: db.contentGroupId ?? undefined,
  groupOrder: db.groupOrder ?? undefined,
  dynamicMetadata: parseJsonData(db.dynamicMetadata),
  createdAt: parseDate(db.createdAt),
  updatedAt: parseDate(db.updatedAt)
})

export const toLibraryItemDb = (dto: CreateLibraryItemDTO): DbNewLibraryItem => ({
  id: ensureId(dto, () => crypto.randomUUID()),
  type: dto.type,
  name: dto.name ?? null,
  language: dto.language ?? null,
  sourceUri: dto.sourceUri ?? null,
  storagePath: dto.storagePath ?? null,
  contentDocumentPath: dto.contentDocumentPath ?? null,
  contentGroupId: dto.contentGroupId ?? null,
  groupOrder: dto.groupOrder ?? null,
  dynamicMetadata: stringifyJsonData(dto.dynamicMetadata)
})

export const toLibraryItemUpdateDb = (dto: UpdateLibraryItemDTO): DbLibraryItemUpdate => ({
  ...(dto.type && { type: dto.type }),
  ...(dto.name !== undefined && { name: dto.name ?? null }),
  ...(dto.language !== undefined && { language: dto.language ?? null }),
  ...(dto.sourceUri !== undefined && { sourceUri: dto.sourceUri ?? null }),
  ...(dto.storagePath !== undefined && { storagePath: dto.storagePath ?? null }),
  ...(dto.contentDocumentPath !== undefined && {
    contentDocumentPath: dto.contentDocumentPath ?? null
  }),
  ...(dto.contentGroupId !== undefined && { contentGroupId: dto.contentGroupId ?? null }),
  ...(dto.groupOrder !== undefined && { groupOrder: dto.groupOrder ?? null }),
  ...(dto.dynamicMetadata && { dynamicMetadata: stringifyJsonData(dto.dynamicMetadata) })
})

/* -------------------------------------------------------------------------- */
/*                            ContentGroup Converters                        */
/* -------------------------------------------------------------------------- */

export const toContentGroupDomain = (db: DbContentGroup): ContentGroup => ({
  id: db.id,
  type: db.type,
  name: db.name,
  dynamicMetadata: parseJsonData(db.dynamicMetadata),
  createdAt: parseDate(db.createdAt),
  updatedAt: parseDate(db.updatedAt)
})

export const toContentGroupDb = (dto: CreateContentGroupDTO): DbNewContentGroup => ({
  id: ensureId(dto, () => crypto.randomUUID()),
  type: dto.type,
  name: dto.name,
  dynamicMetadata: stringifyJsonData(dto.dynamicMetadata)
})

export const toContentGroupUpdateDb = (dto: UpdateContentGroupDTO): DbContentGroupUpdate => ({
  ...(dto.type && { type: dto.type }),
  ...(dto.name && { name: dto.name }),
  ...(dto.dynamicMetadata && { dynamicMetadata: stringifyJsonData(dto.dynamicMetadata) })
})

/* -------------------------------------------------------------------------- */
/*                              Collection Converters                        */
/* -------------------------------------------------------------------------- */

export const toCollectionDomain = (db: DbCollection): Collection => ({
  id: db.id,
  name: db.name,
  dynamicMetadata: parseJsonData(db.dynamicMetadata),
  createdAt: parseDate(db.createdAt),
  updatedAt: parseDate(db.updatedAt)
})

export const toCollectionDb = (dto: CreateCollectionDTO): DbNewCollection => ({
  id: ensureId(dto, () => crypto.randomUUID()),
  name: dto.name,
  dynamicMetadata: stringifyJsonData(dto.dynamicMetadata)
})

export const toCollectionUpdateDb = (dto: UpdateCollectionDTO): DbCollectionUpdate => ({
  ...(dto.name && { name: dto.name }),
  ...(dto.dynamicMetadata && { dynamicMetadata: stringifyJsonData(dto.dynamicMetadata) })
})

/* -------------------------------------------------------------------------- */
/*                           CollectionMember Converters                     */
/* -------------------------------------------------------------------------- */

export const toCollectionMemberDomain = (db: DbCollectionMember): CollectionMember => ({
  collectionId: db.collectionId,
  itemId: db.itemId,
  itemType: db.itemType,
  itemOrder: db.itemOrder
})

export const toCollectionMemberDb = (dto: CreateCollectionMemberDTO): DbNewCollectionMember => ({
  collectionId: dto.collectionId,
  itemId: dto.itemId,
  itemType: dto.itemType,
  itemOrder: dto.itemOrder ?? 0
})

export const toCollectionMemberUpdateDb = (
  dto: UpdateCollectionMemberDTO
): DbCollectionMemberUpdate => ({
  ...(dto.itemOrder !== undefined && { itemOrder: dto.itemOrder })
})

/* -------------------------------------------------------------------------- */
/*                            Vocabulary Converters                          */
/* -------------------------------------------------------------------------- */

export const toVocabularyEntryDomain = (db: DbVocabularyRegistry): VocabularyEntry => ({
  id: db.id,
  text: db.text,
  language: db.language,
  createdAt: parseDate(db.createdAt)
})

export const toVocabularyEntryDb = (dto: CreateVocabularyEntryDTO): DbNewVocabularyRegistry => ({
  id: ensureId(dto, () => crypto.randomUUID()),
  text: dto.text,
  language: dto.language
})

export const toVocabularyEntryUpdateDb = (
  dto: UpdateVocabularyEntryDTO
): DbVocabularyRegistryUpdate => ({
  ...(dto.text && { text: dto.text }),
  ...(dto.language && { language: dto.language })
})

export const toVocabularySourceDomain = (db: DbVocabularySource): VocabularySource => ({
  vocabularyId: db.vocabularyId,
  libraryItemId: db.libraryItemId,
  contextSentence: db.contextSentence ?? undefined,
  startOffset: db.startOffset ?? undefined,
  endOffset: db.endOffset ?? undefined,
  timestampMs: db.timestampMs ?? undefined
})

export const toVocabularySourceDb = (dto: CreateVocabularySourceDTO): DbNewVocabularySource => ({
  vocabularyId: dto.vocabularyId,
  libraryItemId: dto.libraryItemId,
  contextSentence: dto.contextSentence ?? null,
  startOffset: dto.startOffset ?? null,
  endOffset: dto.endOffset ?? null,
  timestampMs: dto.timestampMs ?? null
})

/* -------------------------------------------------------------------------- */
/*                             Asset Converters                              */
/* -------------------------------------------------------------------------- */

export const toEmbeddedAssetDomain = (db: DbEmbeddedAsset): EmbeddedAsset => ({
  id: db.id,
  libraryItemId: db.libraryItemId,
  storagePath: db.storagePath,
  format: db.format ?? undefined,
  originalSrc: db.originalSrc ?? undefined,
  width: db.width ?? undefined,
  height: db.height ?? undefined,
  sizeBytes: db.sizeBytes ?? undefined,
  checksum: db.checksum ?? undefined,
  createdAt: parseDate(db.createdAt)
})

export const toEmbeddedAssetDb = (dto: CreateEmbeddedAssetDTO): DbNewEmbeddedAsset => ({
  id: ensureId(dto, () => crypto.randomUUID()),
  libraryItemId: dto.libraryItemId,
  storagePath: dto.storagePath,
  format: dto.format ?? null,
  originalSrc: dto.originalSrc ?? null,
  width: dto.width ?? null,
  height: dto.height ?? null,
  sizeBytes: dto.sizeBytes ?? null,
  checksum: dto.checksum ?? null
})

export const toEmbeddedAssetUpdateDb = (dto: UpdateEmbeddedAssetDTO): DbEmbeddedAssetUpdate => ({
  ...(dto.storagePath && { storagePath: dto.storagePath }),
  ...(dto.format !== undefined && { format: dto.format ?? null }),
  ...(dto.originalSrc !== undefined && { originalSrc: dto.originalSrc ?? null }),
  ...(dto.width !== undefined && { width: dto.width ?? null }),
  ...(dto.height !== undefined && { height: dto.height ?? null }),
  ...(dto.sizeBytes !== undefined && { sizeBytes: dto.sizeBytes ?? null }),
  ...(dto.checksum !== undefined && { checksum: dto.checksum ?? null })
})

/* -------------------------------------------------------------------------- */
/*                          SupplementaryFile Converters                     */
/* -------------------------------------------------------------------------- */

export const toSupplementaryFileDomain = (db: DbSupplementaryFile): SupplementaryFile => ({
  id: db.id,
  libraryItemId: db.libraryItemId,
  type: db.type,
  storagePath: db.storagePath,
  format: db.format ?? undefined,
  language: db.language ?? undefined,
  filename: db.filename ?? undefined,
  sizeBytes: db.sizeBytes ?? undefined,
  checksum: db.checksum ?? undefined,
  createdAt: parseDate(db.createdAt)
})

export const toSupplementaryFileDb = (dto: CreateSupplementaryFileDTO): DbNewSupplementaryFile => ({
  id: ensureId(dto, () => crypto.randomUUID()),
  libraryItemId: dto.libraryItemId,
  type: dto.type,
  storagePath: dto.storagePath,
  format: dto.format ?? null,
  language: dto.language ?? null,
  filename: dto.filename ?? null,
  sizeBytes: dto.sizeBytes ?? null,
  checksum: dto.checksum ?? null
})

export const toSupplementaryFileUpdateDb = (
  dto: UpdateSupplementaryFileDTO
): DbSupplementaryFileUpdate => ({
  ...(dto.type && { type: dto.type }),
  ...(dto.storagePath && { storagePath: dto.storagePath }),
  ...(dto.format !== undefined && { format: dto.format ?? null }),
  ...(dto.language !== undefined && { language: dto.language ?? null }),
  ...(dto.filename !== undefined && { filename: dto.filename ?? null }),
  ...(dto.sizeBytes !== undefined && { sizeBytes: dto.sizeBytes ?? null }),
  ...(dto.checksum !== undefined && { checksum: dto.checksum ?? null })
})

/* -------------------------------------------------------------------------- */
/*                             Plugin Data Converters                        */
/* -------------------------------------------------------------------------- */

export const toPluginDataDomainSingle = (db: DbPluginData): PluginData => ({
  id: db.id,
  pluginId: db.pluginId,
  key: db.key,
  jsonData: db.jsonData,
  libraryItemId: db.libraryItemId ?? undefined,
  createdAt: parseDate(db.createdAt),
  updatedAt: parseDate(db.updatedAt)
})

export const toPluginDataDb = (dto: CreatePluginDataDTO): DbNewPluginData => ({
  pluginId: dto.pluginId,
  key: dto.key,
  jsonData: dto.jsonData,
  libraryItemId: dto.libraryItemId ?? null
})

export const toPluginDataUpdateDb = (dto: UpdatePluginDataDTO): DbPluginDataUpdate => ({
  ...(dto.key && { key: dto.key }),
  ...(dto.jsonData !== undefined && { jsonData: dto.jsonData }),
  ...(dto.libraryItemId !== undefined && { libraryItemId: dto.libraryItemId ?? null })
})

/* -------------------------------------------------------------------------- */
/*                             App Settings Converters                       */
/* -------------------------------------------------------------------------- */

export const toAppSettingDomain = (db: DbAppSettings): AppSetting => ({
  key: db.key,
  value: db.value,
  createdAt: parseDate(db.createdAt),
  updatedAt: parseDate(db.updatedAt)
})

export const toAppSettingDb = (dto: CreateAppSettingDTO): DbNewAppSettings => ({
  key: dto.key,
  value: dto.value
})

export const toAppSettingUpdateDb = (dto: UpdateAppSettingDTO): DbAppSettingsUpdate => ({
  value: dto.value
})

/* -------------------------------------------------------------------------- */
/*                              Array Converters                             */
/* -------------------------------------------------------------------------- */

export const toLibraryItemsDomain = (items: DbLibraryItem[]) =>
  convertArray(items, toLibraryItemDomain)

export const toContentGroupsDomain = (groups: DbContentGroup[]) =>
  convertArray(groups, toContentGroupDomain)

export const toCollectionsDomain = (collections: DbCollection[]) =>
  convertArray(collections, toCollectionDomain)

export const toCollectionMembersDomain = (members: DbCollectionMember[]) =>
  convertArray(members, toCollectionMemberDomain)

export const toVocabularyEntriesDomain = (entries: DbVocabularyRegistry[]) =>
  convertArray(entries, toVocabularyEntryDomain)

export const toVocabularySourcesDomain = (sources: DbVocabularySource[]) =>
  convertArray(sources, toVocabularySourceDomain)

export const toEmbeddedAssetsDomain = (assets: DbEmbeddedAsset[]) =>
  convertArray(assets, toEmbeddedAssetDomain)

export const toSupplementaryFilesDomain = (files: DbSupplementaryFile[]) =>
  convertArray(files, toSupplementaryFileDomain)

export const toPluginDataDomain = (data: DbPluginData[]) =>
  convertArray(data, toPluginDataDomainSingle)

export const toAppSettingsDomain = (settings: DbAppSettings[]) =>
  convertArray(settings, toAppSettingDomain)
