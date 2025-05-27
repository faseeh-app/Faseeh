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
  const handle = <TArgs extends unknown[], TResult>(
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
  const handlePath = <TArgs extends unknown[], TResult>(
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
  handlePath('storage:getFaseehFolderPath', pathHandlers.getFaseehFolderPath)
  handlePath('storage:getLibraryItemDirectoryPath', pathHandlers.getLibraryItemDirectoryPath)
  handle('storage:getEmbeddedAssetAbsolutePath', pathHandlers.getEmbeddedAssetAbsolutePathFromId)
  handle(
    'storage:getSupplementaryFileAbsolutePath',
    pathHandlers.getSupplementaryFileAbsolutePathFromId
  )
  handlePath('storage:getPluginDirectoryPath', pathHandlers.getPluginDirectoryPath)
  handlePath('storage:listPluginDirectories', pathHandlers.listPluginDirectories)
  handlePath('storage:getConfigDirectoryPath', pathHandlers.getConfigDirectoryPath)

  // == LibraryItems & Document.json ==
  handle('storage:getLibraryItems', libraryFileHandlers.getLibraryItems)
  handle('storage:getLibraryItemById', libraryFileHandlers.getLibraryItemById)
  handle('storage:createLibraryItem', libraryFileHandlers.createLibraryItem)
  handle('storage:updateLibraryItem', libraryFileHandlers.updateLibraryItem)
  handle('storage:deleteLibraryItem', libraryFileHandlers.deleteLibraryItem)
  handle('storage:getDocumentJson', libraryFileHandlers.getDocumentJson) // Takes db as first arg in library.ts
  handlePath('storage:saveDocumentJson', libraryFileHandlers.saveDocumentJson) // Does not take db as first arg in library.ts

  // == PluginData (Database) ==
  handle('storage:getPluginDataEntries', pluginHandlers.getPluginDataEntries)
  handle('storage:getPluginDataEntryById', pluginHandlers.getPluginDataEntryById)
  handle('storage:createPluginDataEntry', pluginHandlers.createPluginDataEntry)
  handle('storage:updatePluginDataEntry', pluginHandlers.updatePluginDataEntry)
  handle('storage:deletePluginDataEntry', pluginHandlers.deletePluginDataEntry)
  handle('storage:deletePluginDataEntriesByKey', pluginHandlers.deletePluginDataEntriesByKey)

  // == Plugin File Data (Filesystem) ==
  handlePath('storage:readPluginDataFile', pluginHandlers.readPluginDataFile)
  handlePath('storage:writePluginDataFile', pluginHandlers.writePluginDataFile)
  handlePath('storage:deletePluginDataFile', pluginHandlers.deletePluginDataFile)
  handlePath('storage:listPluginDataFiles', pluginHandlers.listPluginDataFiles)

  // == AppSettings (Database) ==
  handle('storage:getAppSetting', settingsHandlers.getAppSetting)
  handle('storage:getAllAppSettings', settingsHandlers.getAllAppSettings)
  handle('storage:setAppSetting', settingsHandlers.setAppSetting)
  handle('storage:deleteAppSetting', settingsHandlers.deleteAppSetting)

  // == Specific Config Files (Filesystem) ==
  handlePath('storage:getEnabledPluginIds', settingsHandlers.getEnabledPluginIds)
  handlePath('storage:setEnabledPluginIds', settingsHandlers.setEnabledPluginIds)

  // == ContentGroups ==
  handle('storage:getContentGroups', groupHandlers.getContentGroups)
  handle('storage:getContentGroupById', groupHandlers.getContentGroupById)
  handle('storage:createContentGroup', groupHandlers.createContentGroup)
  handle('storage:updateContentGroup', groupHandlers.updateContentGroup)
  handle('storage:deleteContentGroup', groupHandlers.deleteContentGroup)

  // == Collections ==
  handle('storage:getCollections', collectionHandlers.getCollections)
  handle('storage:getCollectionById', collectionHandlers.getCollectionById)
  handle('storage:createCollection', collectionHandlers.createCollection)
  handle('storage:updateCollection', collectionHandlers.updateCollection)
  handle('storage:deleteCollection', collectionHandlers.deleteCollection)

  // == CollectionMembers ==
  handle('storage:getCollectionMembers', collectionHandlers.getCollectionMembers)
  handle('storage:getCollectionsForMember', collectionHandlers.getCollectionsForMember)
  handle('storage:addCollectionMember', collectionHandlers.addCollectionMember)
  handle('storage:updateCollectionMemberOrder', collectionHandlers.updateCollectionMemberOrder)
  handle('storage:removeCollectionMember', collectionHandlers.removeCollectionMember)

  // == VocabularyRegistry ==
  handle('storage:getVocabularyEntries', vocabularyHandlers.getVocabularyEntries)
  handle('storage:getVocabularyEntryById', vocabularyHandlers.getVocabularyEntryById)
  handle('storage:findOrCreateVocabularyEntry', vocabularyHandlers.findOrCreateVocabularyEntry)
  handle('storage:updateVocabularyEntry', vocabularyHandlers.updateVocabularyEntry)
  handle('storage:deleteVocabularyEntry', vocabularyHandlers.deleteVocabularyEntry)

  // == VocabularySources ==
  handle('storage:getVocabularySources', vocabularyHandlers.getVocabularySources)
  handle('storage:addVocabularySource', vocabularyHandlers.addVocabularySource)
  handle('storage:deleteVocabularySources', vocabularyHandlers.deleteVocabularySources)

  // == EmbeddedAssets ==
  handle('storage:getEmbeddedAssetsByLibraryItem', assetHandlers.getEmbeddedAssetsByLibraryItem)
  handle('storage:getEmbeddedAssetById', assetHandlers.getEmbeddedAssetById)
  handle('storage:createEmbeddedAsset', assetHandlers.createEmbeddedAsset)
  handle('storage:updateEmbeddedAsset', assetHandlers.updateEmbeddedAsset)
  handle('storage:deleteEmbeddedAsset', assetHandlers.deleteEmbeddedAsset)

  // == SupplementaryFiles ==
  handle(
    'storage:getSupplementaryFilesByLibraryItem',
    supplementaryFileHandlers.getSupplementaryFilesByLibraryItem
  )
  handle('storage:getSupplementaryFileById', supplementaryFileHandlers.getSupplementaryFileById)
  handle('storage:createSupplementaryFile', supplementaryFileHandlers.createSupplementaryFile)
  handle('storage:updateSupplementaryFile', supplementaryFileHandlers.updateSupplementaryFile)
  handle('storage:deleteSupplementaryFile', supplementaryFileHandlers.deleteSupplementaryFile)
}
