import { ipcMain } from 'electron'
import type { Kysely } from 'kysely'
import type { Database } from '../../db/types'
import * as pathHandlers from './paths'
import * as libraryFileHandlers from './library'
import * as pluginHandlers from './plugins'
import * as settingsHandlers from './settings'
import * as groupHandlers from './groups'
import * as collectionHandlers from './collections'
import * as vocabularyHandlers from './vocabulary'
import * as assetHandlers from './assets'
import * as supplementaryFileHandlers from './supplementary'

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
  dbHandle('storage:getLibraryItems', libraryFileHandlers.getLibraryItems)
  dbHandle('storage:getLibraryItemById', libraryFileHandlers.getLibraryItemById)
  dbHandle('storage:createLibraryItem', libraryFileHandlers.createLibraryItem)
  dbHandle('storage:updateLibraryItem', libraryFileHandlers.updateLibraryItem)
  dbHandle('storage:deleteLibraryItem', libraryFileHandlers.deleteLibraryItem)
  dbHandle('storage:getDocumentJson', libraryFileHandlers.getDocumentJson) // Takes db as first arg in library.ts
  fsHandlePath('storage:saveDocumentJson', libraryFileHandlers.saveDocumentJson) // Does not take db as first arg in library.ts

  // == PluginData (Database) ==
  dbHandle('storage:getPluginDataEntries', pluginHandlers.getPluginDataEntries)
  dbHandle('storage:getPluginDataEntryById', pluginHandlers.getPluginDataEntryById)
  dbHandle('storage:createPluginDataEntry', pluginHandlers.createPluginDataEntry)
  dbHandle('storage:updatePluginDataEntry', pluginHandlers.updatePluginDataEntry)
  dbHandle('storage:deletePluginDataEntry', pluginHandlers.deletePluginDataEntry)
  dbHandle('storage:deletePluginDataEntriesByKey', pluginHandlers.deletePluginDataEntriesByKey)

  // == Plugin File Data (Filesystem) ==
  fsHandlePath('storage:readPluginManifest', pluginHandlers.readPluginManifest)
  fsHandlePath('storage:readPluginDataFile', pluginHandlers.readPluginDataFile)
  fsHandlePath('storage:writePluginDataFile', pluginHandlers.writePluginDataFile)
  fsHandlePath('storage:deletePluginDataFile', pluginHandlers.deletePluginDataFile)
  fsHandlePath('storage:listPluginDataFiles', pluginHandlers.listPluginDataFiles)

  // == AppSettings (Database) ==
  dbHandle('storage:getAppSetting', settingsHandlers.getAppSetting)
  dbHandle('storage:getAllAppSettings', settingsHandlers.getAllAppSettings)
  dbHandle('storage:setAppSetting', settingsHandlers.setAppSetting)
  dbHandle('storage:deleteAppSetting', settingsHandlers.deleteAppSetting)

  // == Specific Config Files (Filesystem) ==
  fsHandlePath('storage:getEnabledPluginIds', settingsHandlers.getEnabledPluginIds)
  fsHandlePath('storage:setEnabledPluginIds', settingsHandlers.setEnabledPluginIds)

  // == ContentGroups ==
  dbHandle('storage:getContentGroups', groupHandlers.getContentGroups)
  dbHandle('storage:getContentGroupById', groupHandlers.getContentGroupById)
  dbHandle('storage:createContentGroup', groupHandlers.createContentGroup)
  dbHandle('storage:updateContentGroup', groupHandlers.updateContentGroup)
  dbHandle('storage:deleteContentGroup', groupHandlers.deleteContentGroup)

  // == Collections ==
  dbHandle('storage:getCollections', collectionHandlers.getCollections)
  dbHandle('storage:getCollectionById', collectionHandlers.getCollectionById)
  dbHandle('storage:createCollection', collectionHandlers.createCollection)
  dbHandle('storage:updateCollection', collectionHandlers.updateCollection)
  dbHandle('storage:deleteCollection', collectionHandlers.deleteCollection)

  // == CollectionMembers ==
  dbHandle('storage:getCollectionMembers', collectionHandlers.getCollectionMembers)
  dbHandle('storage:getCollectionsForMember', collectionHandlers.getCollectionsForMember)
  dbHandle('storage:addCollectionMember', collectionHandlers.addCollectionMember)
  dbHandle('storage:updateCollectionMemberOrder', collectionHandlers.updateCollectionMemberOrder)
  dbHandle('storage:removeCollectionMember', collectionHandlers.removeCollectionMember)

  // == VocabularyRegistry ==
  dbHandle('storage:getVocabularyEntries', vocabularyHandlers.getVocabularyEntries)
  dbHandle('storage:getVocabularyEntryById', vocabularyHandlers.getVocabularyEntryById)
  dbHandle('storage:findOrCreateVocabularyEntry', vocabularyHandlers.findOrCreateVocabularyEntry)
  dbHandle('storage:updateVocabularyEntry', vocabularyHandlers.updateVocabularyEntry)
  dbHandle('storage:deleteVocabularyEntry', vocabularyHandlers.deleteVocabularyEntry)

  // == VocabularySources ==
  dbHandle('storage:getVocabularySources', vocabularyHandlers.getVocabularySources)
  dbHandle('storage:addVocabularySource', vocabularyHandlers.addVocabularySource)
  dbHandle('storage:deleteVocabularySources', vocabularyHandlers.deleteVocabularySources)

  // == EmbeddedAssets ==
  dbHandle('storage:getEmbeddedAssetsByLibraryItem', assetHandlers.getEmbeddedAssetsByLibraryItem)
  dbHandle('storage:getEmbeddedAssetById', assetHandlers.getEmbeddedAssetById)
  dbHandle('storage:createEmbeddedAsset', assetHandlers.createEmbeddedAsset)
  dbHandle('storage:updateEmbeddedAsset', assetHandlers.updateEmbeddedAsset)
  dbHandle('storage:deleteEmbeddedAsset', assetHandlers.deleteEmbeddedAsset)

  // == SupplementaryFiles ==
  dbHandle(
    'storage:getSupplementaryFilesByLibraryItem',
    supplementaryFileHandlers.getSupplementaryFilesByLibraryItem
  )
  dbHandle('storage:getSupplementaryFileById', supplementaryFileHandlers.getSupplementaryFileById)
  dbHandle('storage:createSupplementaryFile', supplementaryFileHandlers.createSupplementaryFile)
  dbHandle('storage:updateSupplementaryFile', supplementaryFileHandlers.updateSupplementaryFile)
  dbHandle('storage:deleteSupplementaryFile', supplementaryFileHandlers.deleteSupplementaryFile)
}
