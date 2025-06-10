import { ipcMain } from 'electron'
import type { Kysely } from 'kysely'
import type { Database } from '@root/src/shared/db'
import type { ContentDocument } from '@shared/types'
import type {
  LibraryItem,
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
} from '@root/src/shared/models'
import * as pathHandlers from './paths'
import * as libraryFileHandlers from './library'
import * as pluginHandlers from './plugins'
import * as settingsHandlers from './settings'
import * as groupHandlers from './groups'
import * as collectionHandlers from './collections'
import * as vocabularyHandlers from './vocabulary'
import * as assetHandlers from './assets'
import * as supplementaryFileHandlers from './supplementary'
import * as converters from './converters'

export function setupStorageServiceIPC(db: Kysely<Database>): void {
  // Helper for handlers that require the db instance
  const dbHandle = <TArgs extends unknown[], TResult>(
    channel: string,
    handler: (dbInstance: Kysely<Database>, ...args: TArgs) => Promise<TResult>
  ): void => {
    ipcMain.handle(channel, async (_event, ...args: TArgs) => {
      try {
        return await handler(db, ...args)
      } catch (error) {
        console.error(`Error handling IPC message on channel ${channel}:`, error)
        throw error
      }
    })
  }

  // Helper for handlers that do NOT require the db instance
  const fsHandlePath = <TArgs extends unknown[], TResult>(
    channel: string,
    handler: (...args: TArgs) => Promise<TResult>
  ): void => {
    ipcMain.handle(channel, async (_event, ...args: TArgs) => {
      try {
        return await handler(...args)
      } catch (error) {
        console.error(`Error handling IPC message on channel ${channel}:`, error)
        throw error
      }
    })
  }

  // == Path Management ==
  fsHandlePath('storage:getFaseehFolderPath', pathHandlers.getFaseehFolderPath)
  fsHandlePath('storage:getLibraryItemDirectoryPath', pathHandlers.getLibraryItemDirectoryPath)
  dbHandle('storage:getEmbeddedAssetAbsolutePath', pathHandlers.getEmbeddedAssetAbsolutePathFromId)
  dbHandle(
    'storage:getSupplementaryFileAbsolutePath',
    pathHandlers.getSupplementaryFileAbsolutePathFromId
  )
  fsHandlePath('storage:getPluginDirectoryPath', pathHandlers.getPluginDirectoryPath)
  fsHandlePath('storage:listPluginDirectories', pathHandlers.listPluginDirectories)
  fsHandlePath('storage:getConfigDirectoryPath', pathHandlers.getConfigDirectoryPath)
  // == LibraryItems & Document.json ==
  dbHandle('storage:getLibraryItems', async (db, criteria: Partial<LibraryItem>) => {
    const dbItems = await libraryFileHandlers.getLibraryItems(db, criteria)
    return converters.toLibraryItemsDomain(dbItems)
  })
  dbHandle('storage:getLibraryItemById', async (db, id: string) => {
    const dbItem = await libraryFileHandlers.getLibraryItemById(db, id)
    return dbItem ? converters.toLibraryItemDomain(dbItem) : undefined
  })
  dbHandle(
    'storage:createLibraryItem',
    async (db, item: CreateLibraryItemDTO, documentContent: ContentDocument) => {
      const dbItem = converters.toLibraryItemDb(item)
      const newDbItem = await libraryFileHandlers.createLibraryItem(db, dbItem, documentContent)
      return newDbItem ? converters.toLibraryItemDomain(newDbItem) : undefined
    }
  )
  dbHandle(
    'storage:updateLibraryItem',
    async (db, id: string, itemUpdate: UpdateLibraryItemDTO) => {
      const dbUpdate = converters.toLibraryItemUpdateDb(itemUpdate)
      const updatedDbItem = await libraryFileHandlers.updateLibraryItem(db, id, dbUpdate)
      return updatedDbItem ? converters.toLibraryItemDomain(updatedDbItem) : undefined
    }
  )
  dbHandle('storage:deleteLibraryItem', libraryFileHandlers.deleteLibraryItem)
  dbHandle('storage:getDocumentJson', libraryFileHandlers.getDocumentJson) // Takes db as first arg in library.ts
  fsHandlePath('storage:saveDocumentJson', libraryFileHandlers.saveDocumentJson) // Does not take db as first arg in library.ts
  // == PluginData (Database) ==
  dbHandle(
    'storage:getPluginDataEntries',
    async (db, pluginId: string, key?: string, libraryItemId?: string | null) => {
      const dbItems = await pluginHandlers.getPluginDataEntries(db, pluginId, key, libraryItemId)
      return converters.toPluginDataDomain(dbItems)
    }
  )
  dbHandle('storage:getPluginDataEntryById', async (db, id: number) => {
    const dbItem = await pluginHandlers.getPluginDataEntryById(db, id)
    return dbItem ? converters.toPluginDataDomainSingle(dbItem) : undefined
  })
  dbHandle('storage:createPluginDataEntry', async (db, data: CreatePluginDataDTO) => {
    const dbData = converters.toPluginDataDb(data)
    const newDbItem = await pluginHandlers.createPluginDataEntry(db, dbData)
    return newDbItem ? converters.toPluginDataDomainSingle(newDbItem) : undefined
  })
  dbHandle(
    'storage:updatePluginDataEntry',
    async (db, id: number, dataUpdate: UpdatePluginDataDTO) => {
      const dbUpdate = converters.toPluginDataUpdateDb(dataUpdate)
      const updatedDbItem = await pluginHandlers.updatePluginDataEntry(db, id, dbUpdate)
      return updatedDbItem ? converters.toPluginDataDomainSingle(updatedDbItem) : undefined
    }
  )
  dbHandle('storage:deletePluginDataEntry', async (db, id: number) => {
    return await pluginHandlers.deletePluginDataEntry(db, id)
  })
  dbHandle(
    'storage:deletePluginDataEntriesByKey',
    async (db, pluginId: string, key: string, libraryItemId?: string | null) => {
      return await pluginHandlers.deletePluginDataEntriesByKey(db, pluginId, key, libraryItemId)
    }
  )
  // == Plugin File Data (Filesystem) ==
  fsHandlePath('storage:readPluginDataFile', pluginHandlers.readPluginDataFile)
  fsHandlePath('storage:writePluginDataFile', pluginHandlers.writePluginDataFile)
  fsHandlePath('storage:deletePluginDataFile', pluginHandlers.deletePluginDataFile)
  fsHandlePath('storage:listPluginDataFiles', pluginHandlers.listPluginDataFiles) // == AppSettings (Database) ==
  dbHandle('storage:getAppSetting', async (db, key: string) => {
    const dbSetting = await settingsHandlers.getAppSetting(db, key)
    return dbSetting ? converters.toAppSettingDomain(dbSetting) : undefined
  })
  dbHandle('storage:getAllAppSettings', async (db) => {
    const dbSettings = await settingsHandlers.getAllAppSettings(db)
    return converters.toAppSettingsDomain(dbSettings)
  })
  dbHandle(
    'storage:setAppSetting',
    async (db, setting: CreateAppSettingDTO | UpdateAppSettingDTO) => {
      // The settings handler expects a specific format, so we pass the setting as-is
      const dbSetting = await settingsHandlers.setAppSetting(db, setting as any)
      return dbSetting ? converters.toAppSettingDomain(dbSetting) : undefined
    }
  )
  dbHandle('storage:deleteAppSetting', settingsHandlers.deleteAppSetting)

  // == Specific Config Files (Filesystem) ==
  fsHandlePath('storage:getEnabledPluginIds', settingsHandlers.getEnabledPluginIds)
  fsHandlePath('storage:setEnabledPluginIds', settingsHandlers.setEnabledPluginIds)
  // == ContentGroups ==
  dbHandle('storage:getContentGroups', async (db) => {
    const dbGroups = await groupHandlers.getContentGroups(db)
    return converters.toContentGroupsDomain(dbGroups)
  })
  dbHandle('storage:getContentGroupById', async (db, id: string) => {
    const dbGroup = await groupHandlers.getContentGroupById(db, id)
    return dbGroup ? converters.toContentGroupDomain(dbGroup) : undefined
  })
  dbHandle('storage:createContentGroup', async (db, group: CreateContentGroupDTO) => {
    const dbGroup = converters.toContentGroupDb(group)
    const newDbGroup = await groupHandlers.createContentGroup(db, dbGroup)
    return newDbGroup ? converters.toContentGroupDomain(newDbGroup) : undefined
  })
  dbHandle(
    'storage:updateContentGroup',
    async (db, id: string, groupUpdate: UpdateContentGroupDTO) => {
      const dbUpdate = converters.toContentGroupUpdateDb(groupUpdate)
      const updatedDbGroup = await groupHandlers.updateContentGroup(db, id, dbUpdate)
      return updatedDbGroup ? converters.toContentGroupDomain(updatedDbGroup) : undefined
    }
  )
  dbHandle('storage:deleteContentGroup', groupHandlers.deleteContentGroup)

  // == Collections ==
  dbHandle('storage:getCollections', async (db) => {
    const dbCollections = await collectionHandlers.getCollections(db)
    return converters.toCollectionsDomain(dbCollections)
  })
  dbHandle('storage:getCollectionById', async (db, id: string) => {
    const dbCollection = await collectionHandlers.getCollectionById(db, id)
    return dbCollection ? converters.toCollectionDomain(dbCollection) : undefined
  })
  dbHandle('storage:createCollection', async (db, collection: CreateCollectionDTO) => {
    const dbCollection = converters.toCollectionDb(collection)
    const newDbCollection = await collectionHandlers.createCollection(db, dbCollection)
    return newDbCollection ? converters.toCollectionDomain(newDbCollection) : undefined
  })
  dbHandle(
    'storage:updateCollection',
    async (db, id: string, collectionUpdate: UpdateCollectionDTO) => {
      const dbUpdate = converters.toCollectionUpdateDb(collectionUpdate)
      const updatedDbCollection = await collectionHandlers.updateCollection(db, id, dbUpdate)
      return updatedDbCollection ? converters.toCollectionDomain(updatedDbCollection) : undefined
    }
  )
  dbHandle('storage:deleteCollection', collectionHandlers.deleteCollection)

  // == CollectionMembers ==
  dbHandle('storage:getCollectionMembers', async (db, collectionId: string) => {
    const dbMembers = await collectionHandlers.getCollectionMembers(db, collectionId)
    return converters.toCollectionMembersDomain(dbMembers)
  })
  dbHandle('storage:getCollectionsForMember', async (db, itemId: string, itemType: string) => {
    const dbMembers = await collectionHandlers.getCollectionsForMember(db, itemId, itemType)
    return converters.toCollectionMembersDomain(dbMembers)
  })
  dbHandle('storage:addCollectionMember', async (db, member: CreateCollectionMemberDTO) => {
    const dbMember = converters.toCollectionMemberDb(member)
    const newDbMember = await collectionHandlers.addCollectionMember(db, dbMember)
    return newDbMember ? converters.toCollectionMemberDomain(newDbMember) : undefined
  })
  dbHandle(
    'storage:updateCollectionMemberOrder',
    async (db, collectionId: string, itemId: string, itemType: string, newOrder: number) => {
      return await collectionHandlers.updateCollectionMemberOrder(
        db,
        collectionId,
        itemId,
        itemType,
        newOrder
      )
    }
  )
  dbHandle('storage:removeCollectionMember', collectionHandlers.removeCollectionMember)

  // == VocabularyRegistry ==
  dbHandle('storage:getVocabularyEntries', async (db, language?: string, text?: string) => {
    const dbEntries = await vocabularyHandlers.getVocabularyEntries(db, language, text)
    return converters.toVocabularyEntriesDomain(dbEntries)
  })
  dbHandle('storage:getVocabularyEntryById', async (db, id: string) => {
    const dbEntry = await vocabularyHandlers.getVocabularyEntryById(db, id)
    return dbEntry ? converters.toVocabularyEntryDomain(dbEntry) : undefined
  })
  dbHandle(
    'storage:findOrCreateVocabularyEntry',
    async (db, entry: Pick<CreateVocabularyEntryDTO, 'text' | 'language'>) => {
      const dbEntry = await vocabularyHandlers.findOrCreateVocabularyEntry(db, entry)
      return dbEntry ? converters.toVocabularyEntryDomain(dbEntry) : undefined
    }
  )
  dbHandle(
    'storage:updateVocabularyEntry',
    async (db, id: string, entryUpdate: UpdateVocabularyEntryDTO) => {
      const dbUpdate = converters.toVocabularyEntryUpdateDb(entryUpdate)
      const updatedDbEntry = await vocabularyHandlers.updateVocabularyEntry(db, id, dbUpdate)
      return updatedDbEntry ? converters.toVocabularyEntryDomain(updatedDbEntry) : undefined
    }
  )
  dbHandle('storage:deleteVocabularyEntry', vocabularyHandlers.deleteVocabularyEntry)

  // == VocabularySources ==
  dbHandle(
    'storage:getVocabularySources',
    async (db, filters: { vocabularyId?: string; libraryItemId?: string }) => {
      const dbSources = await vocabularyHandlers.getVocabularySources(db, filters)
      return converters.toVocabularySourcesDomain(dbSources)
    }
  )
  dbHandle('storage:addVocabularySource', async (db, source: CreateVocabularySourceDTO) => {
    const dbSource = converters.toVocabularySourceDb(source)
    const newDbSource = await vocabularyHandlers.addVocabularySource(db, dbSource)
    return newDbSource ? converters.toVocabularySourceDomain(newDbSource) : undefined
  })
  dbHandle('storage:deleteVocabularySources', vocabularyHandlers.deleteVocabularySources)

  // == EmbeddedAssets ==
  dbHandle('storage:getEmbeddedAssetsByLibraryItem', async (db, libraryItemId: string) => {
    const dbAssets = await assetHandlers.getEmbeddedAssetsByLibraryItem(db, libraryItemId)
    return converters.toEmbeddedAssetsDomain(dbAssets)
  })
  dbHandle('storage:getEmbeddedAssetById', async (db, id: string) => {
    const dbAsset = await assetHandlers.getEmbeddedAssetById(db, id)
    return dbAsset ? converters.toEmbeddedAssetDomain(dbAsset) : undefined
  })
  dbHandle('storage:createEmbeddedAsset', async (db, asset: CreateEmbeddedAssetDTO) => {
    const dbAsset = converters.toEmbeddedAssetDb(asset)
    const newDbAsset = await assetHandlers.createEmbeddedAsset(db, dbAsset)
    return newDbAsset ? converters.toEmbeddedAssetDomain(newDbAsset) : undefined
  })
  dbHandle(
    'storage:updateEmbeddedAsset',
    async (db, id: string, assetUpdate: UpdateEmbeddedAssetDTO) => {
      const dbUpdate = converters.toEmbeddedAssetUpdateDb(assetUpdate)
      const updatedDbAsset = await assetHandlers.updateEmbeddedAsset(db, id, dbUpdate)
      return updatedDbAsset ? converters.toEmbeddedAssetDomain(updatedDbAsset) : undefined
    }
  )
  dbHandle('storage:deleteEmbeddedAsset', assetHandlers.deleteEmbeddedAsset)

  // == SupplementaryFiles ==
  dbHandle(
    'storage:getSupplementaryFilesByLibraryItem',
    async (db, libraryItemId: string, type?: string, language?: string) => {
      const dbFiles = await supplementaryFileHandlers.getSupplementaryFilesByLibraryItem(
        db,
        libraryItemId,
        type,
        language
      )
      return converters.toSupplementaryFilesDomain(dbFiles)
    }
  )
  dbHandle('storage:getSupplementaryFileById', async (db, id: string) => {
    const dbFile = await supplementaryFileHandlers.getSupplementaryFileById(db, id)
    return dbFile ? converters.toSupplementaryFileDomain(dbFile) : undefined
  })
  dbHandle('storage:createSupplementaryFile', async (db, file: CreateSupplementaryFileDTO) => {
    const dbFile = converters.toSupplementaryFileDb(file)
    const newDbFile = await supplementaryFileHandlers.createSupplementaryFile(db, dbFile)
    return newDbFile ? converters.toSupplementaryFileDomain(newDbFile) : undefined
  })
  dbHandle(
    'storage:updateSupplementaryFile',
    async (db, id: string, fileUpdate: UpdateSupplementaryFileDTO) => {
      const dbUpdate = converters.toSupplementaryFileUpdateDb(fileUpdate)
      const updatedDbFile = await supplementaryFileHandlers.updateSupplementaryFile(
        db,
        id,
        dbUpdate
      )
      return updatedDbFile ? converters.toSupplementaryFileDomain(updatedDbFile) : undefined
    }
  )
  dbHandle('storage:deleteSupplementaryFile', supplementaryFileHandlers.deleteSupplementaryFile)
}
