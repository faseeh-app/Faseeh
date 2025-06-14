import type { IStorage } from '@shared/types/domain-storage'
import {
  SupplementaryFile,
  CreateSupplementaryFileDTO,
  UpdateSupplementaryFileDTO,
  AppSetting,
  CreateAppSettingDTO,
  PluginData,
  UpdateAppSettingDTO,
  UpdatePluginDataDTO,
  VocabularySource
} from '@shared/types/models'
import { StorageEvents } from '@shared/types/types'
import { EventBusService } from '@renderer/core/services/event-bus/event-bus-service'

const { ipcRenderer } = require('electron')

/**
 * Renderer storage service that provides access to all data persistence operations.
 *
 * This service acts as a bridge between the renderer process and the main process storage layer,
 * using Electron IPC to communicate with the underlying database and file system operations.
 * It extends EventBusService to emit storage-related events.
 * @public
 */
class StorageService extends EventBusService<StorageEvents> implements IStorage {
  constructor() {
    super('storage')
  }

  // == Path Management ==
  async getFaseehFolderPath(): Promise<string> {
    return ipcRenderer.invoke('storage:getFaseehFolderPath')
  }

  async getLibraryItemDirectoryPath(libraryItemId: string): Promise<string> {
    return ipcRenderer.invoke('storage:getLibraryItemDirectoryPath', libraryItemId)
  }

  async getEmbeddedAssetAbsolutePath(assetId: string): Promise<string> {
    return ipcRenderer.invoke('storage:getEmbeddedAssetAbsolutePath', assetId)
  }

  async getSupplementaryFileAbsolutePath(fileId: string): Promise<string> {
    return ipcRenderer.invoke('storage:getSupplementaryFileAbsolutePath', fileId)
  }

  async getPluginDirectoryPath(pluginId: string): Promise<string> {
    return ipcRenderer.invoke('storage:getPluginDirectoryPath', pluginId)
  }

  async listPluginDirectories(): Promise<string[]> {
    return ipcRenderer.invoke('storage:listPluginDirectories')
  }

  async getConfigDirectoryPath(): Promise<string> {
    return ipcRenderer.invoke('storage:getConfigDirectoryPath')
  }

  // == LibraryItems & Document.json ==
  async getLibraryItems(criteria?: any): Promise<any[]> {
    return ipcRenderer.invoke('storage:getLibraryItems', criteria)
  }

  async getLibraryItemById(id: string): Promise<any> {
    return ipcRenderer.invoke('storage:getLibraryItemById', id)
  }

  async createLibraryItem(item: any, documentContent?: any): Promise<any> {
    return ipcRenderer.invoke('storage:createLibraryItem', item, documentContent)
  }

  async updateLibraryItem(id: string, itemUpdate: any): Promise<any> {
    return ipcRenderer.invoke('storage:updateLibraryItem', id, itemUpdate)
  }

  async deleteLibraryItem(id: string): Promise<boolean> {
    return ipcRenderer.invoke('storage:deleteLibraryItem', id)
  }

  async getDocumentJson(libraryItemId: string): Promise<any> {
    return ipcRenderer.invoke('storage:getDocumentJson', libraryItemId)
  }

  async saveDocumentJson(libraryItemId: string, content: any): Promise<boolean> {
    return ipcRenderer.invoke('storage:saveDocumentJson', libraryItemId, content)
  }

  // == PluginData (Database) ==
  async getPluginDataEntries(
    pluginId: string,
    key?: string,
    libraryItemId?: string | null
  ): Promise<PluginData[]> {
    return ipcRenderer.invoke('storage:getPluginDataEntries', pluginId, key, libraryItemId)
  }

  async getPluginDataEntryById(id: number): Promise<PluginData | undefined> {
    return ipcRenderer.invoke('storage:getPluginDataEntryById', id)
  }

  async createPluginDataEntry(data: any): Promise<any> {
    return ipcRenderer.invoke('storage:createPluginDataEntry', data)
  }

  async updatePluginDataEntry(
    id: number,
    dataUpdate: UpdatePluginDataDTO
  ): Promise<PluginData | undefined> {
    return ipcRenderer.invoke('storage:updatePluginDataEntry', id, dataUpdate)
  }

  async deletePluginDataEntry(id: number): Promise<boolean> {
    return ipcRenderer.invoke('storage:deletePluginDataEntry', id)
  }

  async deletePluginDataEntriesByKey(
    pluginId: string,
    key: string,
    libraryItemId?: string | null
  ): Promise<number> {
    return ipcRenderer.invoke('storage:deletePluginDataEntriesByKey', pluginId, key, libraryItemId)
  }

  // == Plugin File Data (Filesystem) ==
  async readPluginManifest(pluginId: string): Promise<any> {
    return ipcRenderer.invoke('storage:readPluginManifest', pluginId)
  }

  async readPluginDataFile(pluginId: string, relativePath: string): Promise<string> {
    return ipcRenderer.invoke('storage:readPluginDataFile', pluginId, relativePath)
  }

  async writePluginDataFile(
    pluginId: string,
    relativePath: string,
    content: string
  ): Promise<boolean> {
    return ipcRenderer.invoke('storage:writePluginDataFile', pluginId, relativePath, content)
  }

  async deletePluginDataFile(pluginId: string, relativePath: string): Promise<boolean> {
    return ipcRenderer.invoke('storage:deletePluginDataFile', pluginId, relativePath)
  }

  async listPluginDataFiles(pluginId: string, subDirectory?: string): Promise<string[]> {
    return ipcRenderer.invoke('storage:listPluginDataFiles', pluginId, subDirectory)
  }

  // == AppSettings (Database - for settings.json like data) ==
  async getAppSetting(key: string): Promise<any> {
    return ipcRenderer.invoke('storage:getAppSetting', key)
  }

  async getAllAppSettings(): Promise<any[]> {
    return ipcRenderer.invoke('storage:getAllAppSettings')
  }

  async setAppSetting(
    setting: CreateAppSettingDTO | UpdateAppSettingDTO
  ): Promise<AppSetting | undefined> {
    return ipcRenderer.invoke('storage:setAppSetting', setting)
  }

  async deleteAppSetting(key: string): Promise<boolean> {
    return ipcRenderer.invoke('storage:deleteAppSetting', key)
  }

  // == Specific Config Files (Filesystem) ==
  async getEnabledPluginIds(): Promise<string[]> {
    return ipcRenderer.invoke('storage:getEnabledPluginIds')
  }

  async setEnabledPluginIds(pluginIds: string[]): Promise<boolean> {
    return ipcRenderer.invoke('storage:setEnabledPluginIds', pluginIds)
  }

  // == ContentGroups ==
  async getContentGroups(): Promise<any[]> {
    return ipcRenderer.invoke('storage:getContentGroups')
  }

  async getContentGroupById(id: string): Promise<any> {
    return ipcRenderer.invoke('storage:getContentGroupById', id)
  }

  async createContentGroup(group: any): Promise<any> {
    return ipcRenderer.invoke('storage:createContentGroup', group)
  }

  async updateContentGroup(id: string, groupUpdate: any): Promise<any> {
    return ipcRenderer.invoke('storage:updateContentGroup', id, groupUpdate)
  }

  async deleteContentGroup(id: string): Promise<boolean> {
    return ipcRenderer.invoke('storage:deleteContentGroup', id)
  }

  // == Collections ==
  async getCollections(): Promise<any[]> {
    return ipcRenderer.invoke('storage:getCollections')
  }

  async getCollectionById(id: string): Promise<any> {
    return ipcRenderer.invoke('storage:getCollectionById', id)
  }

  async createCollection(collection: any): Promise<any> {
    return ipcRenderer.invoke('storage:createCollection', collection)
  }

  async updateCollection(id: string, collectionUpdate: any): Promise<any> {
    return ipcRenderer.invoke('storage:updateCollection', id, collectionUpdate)
  }

  async deleteCollection(id: string): Promise<boolean> {
    return ipcRenderer.invoke('storage:deleteCollection', id)
  }

  // == CollectionMembers ==
  async getCollectionMembers(collectionId: string): Promise<any[]> {
    return ipcRenderer.invoke('storage:getCollectionMembers', collectionId)
  }

  async getCollectionsForMember(itemId: string, itemType: string): Promise<any[]> {
    return ipcRenderer.invoke('storage:getCollectionsForMember', itemId, itemType)
  }

  async addCollectionMember(member: any): Promise<any> {
    return ipcRenderer.invoke('storage:addCollectionMember', member)
  }

  async updateCollectionMemberOrder(
    collectionId: string,
    itemId: string,
    itemType: string,
    newOrder: number
  ): Promise<boolean> {
    return ipcRenderer.invoke(
      'storage:updateCollectionMemberOrder',
      collectionId,
      itemId,
      itemType,
      newOrder
    )
  }

  async removeCollectionMember(
    collectionId: string,
    itemId: string,
    itemType: string
  ): Promise<boolean> {
    return ipcRenderer.invoke('storage:removeCollectionMember', collectionId, itemId, itemType)
  }

  // == VocabularyRegistry ==
  async getVocabularyEntries(language?: string, text?: string): Promise<any[]> {
    return ipcRenderer.invoke('storage:getVocabularyEntries', language, text)
  }

  async getVocabularyEntryById(id: string): Promise<any> {
    return ipcRenderer.invoke('storage:getVocabularyEntryById', id)
  }

  async findOrCreateVocabularyEntry(entry: any): Promise<any> {
    return ipcRenderer.invoke('storage:findOrCreateVocabularyEntry', entry)
  }

  async updateVocabularyEntry(id: string, entryUpdate: any): Promise<any> {
    return ipcRenderer.invoke('storage:updateVocabularyEntry', id, entryUpdate)
  }

  async deleteVocabularyEntry(id: string): Promise<boolean> {
    return ipcRenderer.invoke('storage:deleteVocabularyEntry', id)
  }

  // == VocabularySources ==
  async getVocabularySources(filters: any): Promise<any[]> {
    return ipcRenderer.invoke('storage:getVocabularySources', filters)
  }

  async addVocabularySource(source: any): Promise<any> {
    return ipcRenderer.invoke('storage:addVocabularySource', source)
  }

  async deleteVocabularySources(
    criteria: Partial<Pick<VocabularySource, 'vocabularyId' | 'libraryItemId'>>
  ): Promise<number> {
    return ipcRenderer.invoke('storage:deleteVocabularySources', criteria)
  }

  // == EmbeddedAssets ==
  async getEmbeddedAssetsByLibraryItem(libraryItemId: string): Promise<any[]> {
    return ipcRenderer.invoke('storage:getEmbeddedAssetsByLibraryItem', libraryItemId)
  }

  async getEmbeddedAssetById(id: string): Promise<any> {
    return ipcRenderer.invoke('storage:getEmbeddedAssetById', id)
  }

  async createEmbeddedAsset(asset: any): Promise<any> {
    return ipcRenderer.invoke('storage:createEmbeddedAsset', asset)
  }

  async updateEmbeddedAsset(id: string, assetUpdate: any): Promise<any> {
    return ipcRenderer.invoke('storage:updateEmbeddedAsset', id, assetUpdate)
  }

  async deleteEmbeddedAsset(id: string): Promise<boolean> {
    return ipcRenderer.invoke('storage:deleteEmbeddedAsset', id)
  }

  // == SupplementaryFiles ==
  async getSupplementaryFilesByLibraryItem(
    libraryItemId: string,
    type?: string,
    language?: string
  ): Promise<SupplementaryFile[]> {
    return ipcRenderer.invoke(
      'storage:getSupplementaryFilesByLibraryItem',
      libraryItemId,
      type,
      language
    )
  }

  async getSupplementaryFileById(id: string): Promise<SupplementaryFile | undefined> {
    return ipcRenderer.invoke('storage:getSupplementaryFileById', id)
  }

  async createSupplementaryFile(
    file: CreateSupplementaryFileDTO
  ): Promise<SupplementaryFile | undefined> {
    return ipcRenderer.invoke('storage:createSupplementaryFile', file)
  }

  async updateSupplementaryFile(
    id: string,
    fileUpdate: UpdateSupplementaryFileDTO
  ): Promise<SupplementaryFile | undefined> {
    return ipcRenderer.invoke('storage:updateSupplementaryFile', id, fileUpdate)
  }

  async deleteSupplementaryFile(id: string): Promise<boolean> {
    return ipcRenderer.invoke('storage:deleteSupplementaryFile', id)
  }
}

/**
 * Singleton instance of the storage service for the renderer process.
 *
 * This is the primary interface for all data persistence operations in the renderer.
 * Use this instance throughout the application to access database and file system.
 *
 * @example
 * ```typescript
 * import { storage } from '@renderer/core/services/storage/storage-service'
 *
 * // Get library items
 * const items = await storage.getLibraryItems()
 *
 * // Create a new library item
 * const newItem = await storage.createLibraryItem({
 *   title: 'My Document',
 *   type: 'text'
 * })
 *
 * // Listen for storage events
 * storage.on('library-item-created', (item) => {
 *   console.log('New item created:', item)
 * })
 * ```
 *
 * @public
 */
export const storage = new StorageService()
