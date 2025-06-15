import { ipcMain, app } from 'electron'
import type { Kysely } from 'kysely'
import type { Database } from '@shared/types/db'
import type { IStorageAPI } from '@shared/types/db-storage'
import type { ContentDocument, PluginManifest, StorageEvents } from '@shared/types/types'
import * as converters from '@shared/utilities/Mappers/db-mappers'
import fs from 'node:fs/promises'
import path from 'node:path'
import { EventBusService } from '@main/services/event-bus-service'
import { db } from '@main/db/database'

// Path Constants
const USER_DATA_PATH = app.getPath('userData')
const FASEEH_FOLDER_NAME = 'faseeh'
const FASEEH_BASE_PATH = path.join(USER_DATA_PATH, FASEEH_FOLDER_NAME)

const LIBRARY_DIR_NAME = 'library'
const PLUGINS_DIR_NAME = 'plugins'
const CONFIG_DIR_NAME = 'config'
const MODELS_DIR_NAME = 'models'

const DOCUMENT_JSON_FILE_NAME = 'document.json'
const EMBEDDED_ASSETS_DIR_NAME = 'assets'
const SUPPLEMENTARY_FILES_DIR_NAME = 'supplementary'
const PLUGIN_DATA_SUBDIR_NAME = 'data'

const ENABLED_PLUGINS_FILE_NAME = 'enabled_plugins.json'
const MANIFEST_FILE_NAME = 'manifest.json'

/**
 * Main process storage service that handles all data persistence operations for the application.
 *
 * This service implements the complete storage layer, managing both database operations via Kysely
 * and file system operations for documents, assets, and plugin data. It extends EventBusService
 * to emit storage-related events and automatically registers IPC handlers for communication
 * with the renderer process.
 *
 * @implements {IStorageAPI}
 */
class StorageService extends EventBusService<StorageEvents> implements IStorageAPI {
  /**
   * Creates a new StorageService instance.
   *
   * @param {Kysely<Database>} db - The database connection instance for data operations
   */
  constructor(private db: Kysely<Database>) {
    super('storage')
    this.db = db
    this.init()
  }

  // Helper method for ensuring directories exist
  private async ensureDirExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true })
    } catch (error) {
      console.error(`Failed to create directory ${dirPath}:`, error)
      throw error
    }
  }

  // Initialize Faseeh directory structure
  public async initializeFaseehDirectory(): Promise<void> {
    await this.ensureDirExists(FASEEH_BASE_PATH)
    await this.ensureDirExists(path.join(FASEEH_BASE_PATH, LIBRARY_DIR_NAME))
    await this.ensureDirExists(path.join(FASEEH_BASE_PATH, PLUGINS_DIR_NAME))
    await this.ensureDirExists(path.join(FASEEH_BASE_PATH, CONFIG_DIR_NAME))
    await this.ensureDirExists(path.join(FASEEH_BASE_PATH, MODELS_DIR_NAME))

    const enabledPluginsPath = path.join(
      FASEEH_BASE_PATH,
      CONFIG_DIR_NAME,
      ENABLED_PLUGINS_FILE_NAME
    )
    try {
      await fs.access(enabledPluginsPath)
    } catch {
      await fs.writeFile(enabledPluginsPath, JSON.stringify([], null, 2))
    }
  }

  /**
   * Initializes the storage service by registering all IPC handlers.
   * This method sets up communication channels between the main and renderer processes
   * for all storage-related operations. Each handler includes error handling and
   * automatic data conversion between domain and database models.
   *
   * Must be called once during application startup to enable storage functionality.
   */
  private init(): void {
    // Helper for methods that need error handling and conversion
    const handle = <TArgs extends unknown[], TResult>(
      channel: string,
      method: (...args: TArgs) => Promise<TResult>
    ): void => {
      ipcMain.handle(channel, async (_event, ...args: TArgs) => {
        try {
          return await method(...args)
        } catch (error) {
          console.error(`Error handling IPC message on channel ${channel}:`, error)
          throw error
        }
      })
    }

    // == Path Management ==
    handle('storage:getFaseehFolderPath', () => this.getFaseehFolderPath())
    handle('storage:getLibraryItemDirectoryPath', (id: string) =>
      this.getLibraryItemDirectoryPath(id)
    )
    handle('storage:getEmbeddedAssetAbsolutePath', (id: string) =>
      this.getEmbeddedAssetAbsolutePath(id)
    )
    handle('storage:getSupplementaryFileAbsolutePath', (id: string) =>
      this.getSupplementaryFileAbsolutePath(id)
    )
    handle('storage:getPluginDirectoryPath', (id: string) => this.getPluginDirectoryPath(id))
    handle('storage:listPluginDirectories', () => this.listPluginDirectories())
    handle('storage:getConfigDirectoryPath', () => this.getConfigDirectoryPath())

    // == LibraryItems & Document.json ==
    handle('storage:getLibraryItems', async (criteria?: any) => {
      const dbItems = await this.getLibraryItems(criteria)
      return converters.toLibraryItemsDomain(dbItems)
    })
    handle('storage:getLibraryItemById', async (id: string) => {
      const dbItem = await this.getLibraryItemById(id)
      return dbItem ? converters.toLibraryItemDomain(dbItem) : undefined
    })
    handle('storage:createLibraryItem', async (item: any, doc?: ContentDocument) => {
      const dbItem = converters.toLibraryItemDb(item)
      const newDbItem = await this.createLibraryItem(dbItem, doc)
      return newDbItem ? converters.toLibraryItemDomain(newDbItem) : undefined
    })
    handle('storage:updateLibraryItem', async (id: string, update: any) => {
      const dbUpdate = converters.toLibraryItemUpdateDb(update)
      const updatedDbItem = await this.updateLibraryItem(id, dbUpdate)
      return updatedDbItem ? converters.toLibraryItemDomain(updatedDbItem) : undefined
    })
    handle('storage:deleteLibraryItem', (id: string) => this.deleteLibraryItem(id))

    handle('storage:getDocumentJson', (id: string) => this.getDocumentJson(id))
    handle('storage:saveDocumentJson', (id: string, content: ContentDocument) =>
      this.saveDocumentJson(id, content)
    ) // == Thumbnail Management ==
    handle(
      'storage:saveThumbnail',
      (libraryItemId: string, thumbnailData: { buffer: ArrayBuffer; filename: string }) =>
        this.saveThumbnail(libraryItemId, thumbnailData)
    )
    handle('storage:getThumbnailPath', (libraryItemId: string) =>
      this.getThumbnailPath(libraryItemId)
    )
    handle('storage:deleteThumbnail', (libraryItemId: string) =>
      this.deleteThumbnail(libraryItemId)
    )

    // == PluginData (Database) ==
    handle(
      'storage:getPluginDataEntries',
      async (pluginId: string, key?: string, libraryItemId?: string | null) => {
        const dbItems = await this.getPluginDataEntries(pluginId, key, libraryItemId)
        return converters.toPluginDataDomain(dbItems)
      }
    )
    handle('storage:getPluginDataEntryById', async (id: number) => {
      const dbItem = await this.getPluginDataEntryById(id)
      return dbItem ? converters.toPluginDataDomainSingle(dbItem) : undefined
    })
    handle('storage:createPluginDataEntry', async (data: any) => {
      const dbData = converters.toPluginDataDb(data)
      const newDbItem = await this.createPluginDataEntry(dbData)
      return newDbItem ? converters.toPluginDataDomainSingle(newDbItem) : undefined
    })
    handle('storage:updatePluginDataEntry', async (id: number, update: any) => {
      const dbUpdate = converters.toPluginDataUpdateDb(update)
      const updatedDbItem = await this.updatePluginDataEntry(id, dbUpdate)
      return updatedDbItem ? converters.toPluginDataDomainSingle(updatedDbItem) : undefined
    })
    handle('storage:deletePluginDataEntry', (id: number) => this.deletePluginDataEntry(id))
    handle(
      'storage:deletePluginDataEntriesByKey',
      (pluginId: string, key: string, libraryItemId?: string | null) =>
        this.deletePluginDataEntriesByKey(pluginId, key, libraryItemId)
    )

    // == Plugin File Data (Filesystem) ==
    handle('storage:readPluginManifest', (pluginId: string) => this.readPluginManifest(pluginId))
    handle('storage:readPluginDataFile', (pluginId: string, path: string) =>
      this.readPluginDataFile(pluginId, path)
    )
    handle('storage:writePluginDataFile', (pluginId: string, path: string, content: string) =>
      this.writePluginDataFile(pluginId, path, content)
    )
    handle('storage:deletePluginDataFile', (pluginId: string, path: string) =>
      this.deletePluginDataFile(pluginId, path)
    )
    handle('storage:listPluginDataFiles', (pluginId: string, subDir?: string) =>
      this.listPluginDataFiles(pluginId, subDir)
    )

    // == AppSettings ==
    handle('storage:getAppSetting', async (key: string) => {
      const dbSetting = await this.getAppSetting(key)
      return dbSetting ? converters.toAppSettingDomain(dbSetting) : undefined
    })
    handle('storage:getAllAppSettings', async () => {
      const dbSettings = await this.getAllAppSettings()
      return converters.toAppSettingsDomain(dbSettings)
    })
    handle('storage:setAppSetting', async (setting: any) => {
      const dbSetting = await this.setAppSetting(setting)
      return dbSetting ? converters.toAppSettingDomain(dbSetting) : undefined
    })
    handle('storage:deleteAppSetting', (key: string) => this.deleteAppSetting(key))

    // == Config Files ==
    handle('storage:getEnabledPluginIds', () => this.getEnabledPluginIds())
    handle('storage:setEnabledPluginIds', (ids: string[]) => this.setEnabledPluginIds(ids))

    // == ContentGroups ==
    handle('storage:getContentGroups', async () => {
      const dbGroups = await this.getContentGroups()
      return converters.toContentGroupsDomain(dbGroups)
    })
    handle('storage:getContentGroupById', async (id: string) => {
      const dbGroup = await this.getContentGroupById(id)
      return dbGroup ? converters.toContentGroupDomain(dbGroup) : undefined
    })
    handle('storage:createContentGroup', async (group: any) => {
      const dbGroup = converters.toContentGroupDb(group)
      const newDbGroup = await this.createContentGroup(dbGroup)
      return newDbGroup ? converters.toContentGroupDomain(newDbGroup) : undefined
    })
    handle('storage:updateContentGroup', async (id: string, update: any) => {
      const dbUpdate = converters.toContentGroupUpdateDb(update)
      const updatedDbGroup = await this.updateContentGroup(id, dbUpdate)
      return updatedDbGroup ? converters.toContentGroupDomain(updatedDbGroup) : undefined
    })
    handle('storage:deleteContentGroup', (id: string) => this.deleteContentGroup(id))

    // == Collections ==
    handle('storage:getCollections', async () => {
      const dbCollections = await this.getCollections()
      return converters.toCollectionsDomain(dbCollections)
    })
    handle('storage:getCollectionById', async (id: string) => {
      const dbCollection = await this.getCollectionById(id)
      return dbCollection ? converters.toCollectionDomain(dbCollection) : undefined
    })
    handle('storage:createCollection', async (collection: any) => {
      const dbCollection = converters.toCollectionDb(collection)
      const newDbCollection = await this.createCollection(dbCollection)
      return newDbCollection ? converters.toCollectionDomain(newDbCollection) : undefined
    })
    handle('storage:updateCollection', async (id: string, update: any) => {
      const dbUpdate = converters.toCollectionUpdateDb(update)
      const updatedDbCollection = await this.updateCollection(id, dbUpdate)
      return updatedDbCollection ? converters.toCollectionDomain(updatedDbCollection) : undefined
    })
    handle('storage:deleteCollection', (id: string) => this.deleteCollection(id))

    // == CollectionMembers ==
    handle('storage:getCollectionMembers', async (id: string) => {
      const dbMembers = await this.getCollectionMembers(id)
      return converters.toCollectionMembersDomain(dbMembers)
    })
    handle('storage:getCollectionsForMember', async (itemId: string, itemType: string) => {
      const dbMembers = await this.getCollectionsForMember(itemId, itemType)
      return converters.toCollectionMembersDomain(dbMembers)
    })
    handle('storage:addCollectionMember', async (member: any) => {
      const dbMember = converters.toCollectionMemberDb(member)
      const newDbMember = await this.addCollectionMember(dbMember)
      return newDbMember ? converters.toCollectionMemberDomain(newDbMember) : undefined
    })
    handle(
      'storage:updateCollectionMemberOrder',
      (collectionId: string, itemId: string, itemType: string, order: number) =>
        this.updateCollectionMemberOrder(collectionId, itemId, itemType, order)
    )
    handle(
      'storage:removeCollectionMember',
      (collectionId: string, itemId: string, itemType: string) =>
        this.removeCollectionMember(collectionId, itemId, itemType)
    )

    // == VocabularyRegistry ==
    handle('storage:getVocabularyEntries', async (language?: string, text?: string) => {
      const dbEntries = await this.getVocabularyEntries(language, text)
      return converters.toVocabularyEntriesDomain(dbEntries)
    })
    handle('storage:getVocabularyEntryById', async (id: string) => {
      const dbEntry = await this.getVocabularyEntryById(id)
      return dbEntry ? converters.toVocabularyEntryDomain(dbEntry) : undefined
    })
    handle('storage:findOrCreateVocabularyEntry', async (entry: any) => {
      const dbEntry = await this.findOrCreateVocabularyEntry(entry)
      return dbEntry ? converters.toVocabularyEntryDomain(dbEntry) : undefined
    })
    handle('storage:updateVocabularyEntry', async (id: string, update: any) => {
      const dbUpdate = converters.toVocabularyEntryUpdateDb(update)
      const updatedDbEntry = await this.updateVocabularyEntry(id, dbUpdate)
      return updatedDbEntry ? converters.toVocabularyEntryDomain(updatedDbEntry) : undefined
    })
    handle('storage:deleteVocabularyEntry', (id: string) => this.deleteVocabularyEntry(id))

    // == VocabularySources ==
    handle('storage:getVocabularySources', async (filters: any) => {
      const dbSources = await this.getVocabularySources(filters)
      return converters.toVocabularySourcesDomain(dbSources)
    })
    handle('storage:addVocabularySource', async (source: any) => {
      const dbSource = converters.toVocabularySourceDb(source)
      const newDbSource = await this.addVocabularySource(dbSource)
      return newDbSource ? converters.toVocabularySourceDomain(newDbSource) : undefined
    })
    handle('storage:deleteVocabularySources', (criteria: any) =>
      this.deleteVocabularySources(criteria)
    )

    // == EmbeddedAssets ==
    handle('storage:getEmbeddedAssetsByLibraryItem', async (id: string) => {
      const dbAssets = await this.getEmbeddedAssetsByLibraryItem(id)
      return converters.toEmbeddedAssetsDomain(dbAssets)
    })
    handle('storage:getEmbeddedAssetById', async (id: string) => {
      const dbAsset = await this.getEmbeddedAssetById(id)
      return dbAsset ? converters.toEmbeddedAssetDomain(dbAsset) : undefined
    })
    handle('storage:createEmbeddedAsset', async (asset: any) => {
      const dbAsset = converters.toEmbeddedAssetDb(asset)
      const newDbAsset = await this.createEmbeddedAsset(dbAsset)
      return newDbAsset ? converters.toEmbeddedAssetDomain(newDbAsset) : undefined
    })
    handle('storage:updateEmbeddedAsset', async (id: string, update: any) => {
      const dbUpdate = converters.toEmbeddedAssetUpdateDb(update)
      const updatedDbAsset = await this.updateEmbeddedAsset(id, dbUpdate)
      return updatedDbAsset ? converters.toEmbeddedAssetDomain(updatedDbAsset) : undefined
    })
    handle('storage:deleteEmbeddedAsset', (id: string) => this.deleteEmbeddedAsset(id))

    // == SupplementaryFiles ==
    handle(
      'storage:getSupplementaryFilesByLibraryItem',
      async (id: string, type?: string, language?: string) => {
        const dbFiles = await this.getSupplementaryFilesByLibraryItem(id, type, language)
        return converters.toSupplementaryFilesDomain(dbFiles)
      }
    )
    handle('storage:getSupplementaryFileById', async (id: string) => {
      const dbFile = await this.getSupplementaryFileById(id)
      return dbFile ? converters.toSupplementaryFileDomain(dbFile) : undefined
    })
    handle('storage:createSupplementaryFile', async (file: any) => {
      const dbFile = converters.toSupplementaryFileDb(file)
      const newDbFile = await this.createSupplementaryFile(dbFile)
      return newDbFile ? converters.toSupplementaryFileDomain(newDbFile) : undefined
    })
    handle('storage:updateSupplementaryFile', async (id: string, update: any) => {
      const dbUpdate = converters.toSupplementaryFileUpdateDb(update)
      const updatedDbFile = await this.updateSupplementaryFile(id, dbUpdate)
      return updatedDbFile ? converters.toSupplementaryFileDomain(updatedDbFile) : undefined
    })
    handle('storage:deleteSupplementaryFile', (id: string) => this.deleteSupplementaryFile(id))
    handle(
      'storage:writeSupplementaryFileContent',
      (libraryItemId: string, filename: string, content: string) =>
        this.writeSupplementaryFileContent(libraryItemId, filename, content)
    )
  }

  // == Path Management ==

  async getFaseehFolderPath(): Promise<string> {
    const userDataPath = app.getPath('userData')
    return path.join(userDataPath, 'faseeh')
  }

  async getLibraryItemDirectoryPath(libraryItemId: string): Promise<string | undefined> {
    if (!libraryItemId) return undefined

    const faseehPath = await this.getFaseehFolderPath()
    const itemPath = path.join(faseehPath, 'library', libraryItemId)

    try {
      await fs.access(itemPath)
      return itemPath
    } catch {
      return undefined
    }
  }

  async getEmbeddedAssetAbsolutePath(assetId: string): Promise<string | undefined> {
    const asset = await this.db
      .selectFrom('embeddedAssets')
      .select(['libraryItemId', 'storagePath'])
      .where('id', '=', assetId)
      .executeTakeFirst()

    if (!asset || !asset.libraryItemId || !asset.storagePath) return undefined

    const faseehPath = await this.getFaseehFolderPath()
    return path.join(faseehPath, 'library', asset.libraryItemId, 'assets', asset.storagePath)
  }

  async getSupplementaryFileAbsolutePath(fileId: string): Promise<string | undefined> {
    const file = await this.db
      .selectFrom('supplementaryFiles')
      .select(['libraryItemId', 'storagePath'])
      .where('id', '=', fileId)
      .executeTakeFirst()

    if (!file || !file.libraryItemId || !file.storagePath) return undefined

    const faseehPath = await this.getFaseehFolderPath()
    return path.join(faseehPath, 'library', file.libraryItemId, 'supplementary', file.storagePath)
  }

  async getPluginDirectoryPath(pluginId: string): Promise<string | undefined> {
    if (!pluginId) return undefined

    const faseehPath = await this.getFaseehFolderPath()
    return path.join(faseehPath, 'plugins', pluginId)
  }

  async listPluginDirectories(): Promise<string[]> {
    try {
      const faseehPath = await this.getFaseehFolderPath()
      const pluginsPath = path.join(faseehPath, 'plugins')
      const entries = await fs.readdir(pluginsPath, { withFileTypes: true })

      return entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.join(pluginsPath, entry.name))
    } catch (error) {
      console.error('Failed to list plugin directories:', error)
      return []
    }
  }

  async getConfigDirectoryPath(): Promise<string> {
    const faseehPath = await this.getFaseehFolderPath()
    return path.join(faseehPath, 'config')
  }

  // == LibraryItems & Document.json ==

  async getLibraryItems(criteria?: any): Promise<any[]> {
    let query = this.db.selectFrom('libraryItems').selectAll()
    if (criteria) {
      // Basic filtering, extend as needed
      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.where(key as any, '=', value)
        }
      })
    }
    return await query.orderBy('createdAt', 'desc').execute()
  }

  async getLibraryItemById(id: string): Promise<any> {
    return await this.db
      .selectFrom('libraryItems')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()
  }

  async createLibraryItem(item: any, documentContent?: ContentDocument): Promise<any> {
    // Ensure library item directory exists
    const itemDirPath = path.join(FASEEH_BASE_PATH, LIBRARY_DIR_NAME, item.id)
    await this.ensureDirExists(itemDirPath)
    await this.ensureDirExists(path.join(itemDirPath, EMBEDDED_ASSETS_DIR_NAME))
    await this.ensureDirExists(path.join(itemDirPath, SUPPLEMENTARY_FILES_DIR_NAME))

    const newItem = await this.db
      .insertInto('libraryItems')
      .values({ ...item, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
      .returningAll()
      .executeTakeFirst()

    if (newItem && documentContent) {
      await this.saveDocumentJson(newItem.id, documentContent)
    }
    return newItem
  }

  async updateLibraryItem(id: string, itemUpdate: any): Promise<any> {
    return await this.db
      .updateTable('libraryItems')
      .set({ ...itemUpdate, updatedAt: new Date().toISOString() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst()
  }
  async deleteLibraryItem(id: string): Promise<boolean> {
    try {
      // Delete related records first to avoid foreign key constraint violations

      // Delete plugin data
      await this.db.deleteFrom('pluginData').where('libraryItemId', '=', id).execute()

      // Delete vocabulary sources
      await this.db.deleteFrom('vocabularySources').where('libraryItemId', '=', id).execute()

      // Delete embedded assets
      await this.db.deleteFrom('embeddedAssets').where('libraryItemId', '=', id).execute()

      // Delete supplementary files
      await this.db.deleteFrom('supplementaryFiles').where('libraryItemId', '=', id).execute()

      // Delete collection members that reference this library item
      await this.db
        .deleteFrom('collectionMembers')
        .where('itemId', '=', id)
        .where('itemType', '=', 'LibraryItem')
        .execute()

      // Now delete the library item itself
      const result = await this.db
        .deleteFrom('libraryItems')
        .where('id', '=', id)
        .executeTakeFirst()

      if (result.numDeletedRows > 0) {
        // Delete the physical directory
        const itemDirPath = path.join(FASEEH_BASE_PATH, LIBRARY_DIR_NAME, id)
        try {
          await fs.rm(itemDirPath, { recursive: true, force: true })
        } catch (error) {
          console.error(`Failed to delete directory for library item ${id}:`, error)
          // Continue even if directory deletion fails
        }
        return true
      }
      return false
    } catch (error) {
      console.error(`Failed to delete library item ${id}:`, error)
      throw error
    }
  }

  async getDocumentJson(libraryItemId: string): Promise<ContentDocument | undefined> {
    const docPath = path.join(
      FASEEH_BASE_PATH,
      LIBRARY_DIR_NAME,
      libraryItemId,
      DOCUMENT_JSON_FILE_NAME
    )
    try {
      const content = await fs.readFile(docPath, 'utf-8')
      return JSON.parse(content) as ContentDocument
    } catch (error) {
      // If file not found, it's not an error, just means no document.json yet
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return undefined
      }
      console.error(`Failed to read document.json for ${libraryItemId}:`, error)
      return undefined
    }
  }
  async saveDocumentJson(libraryItemId: string, content: ContentDocument): Promise<boolean> {
    const itemDirPath = path.join(FASEEH_BASE_PATH, LIBRARY_DIR_NAME, libraryItemId)
    await this.ensureDirExists(itemDirPath) // Ensure parent dir exists
    const docPath = path.join(itemDirPath, DOCUMENT_JSON_FILE_NAME)
    try {
      await fs.writeFile(docPath, JSON.stringify(content, null, 2))
      return true
    } catch (error) {
      console.error(`Failed to save document.json for ${libraryItemId}:`, error)
      return false
    }
  }
  // == Thumbnail Management ==

  async saveThumbnail(
    libraryItemId: string,
    thumbnailData: { buffer: ArrayBuffer; filename: string }
  ): Promise<boolean> {
    console.log('Main process saveThumbnail called with:', {
      libraryItemId,
      bufferSize: thumbnailData?.buffer?.byteLength,
      filename: thumbnailData?.filename
    })

    if (!libraryItemId || !thumbnailData || !thumbnailData.buffer || !thumbnailData.filename) {
      console.error('Invalid parameters for saveThumbnail:', {
        libraryItemId: !!libraryItemId,
        hasBuffer: !!thumbnailData?.buffer,
        hasFilename: !!thumbnailData?.filename,
        thumbnailData
      })
      return false
    }

    const itemDirPath = path.join(FASEEH_BASE_PATH, LIBRARY_DIR_NAME, libraryItemId)
    console.log('Creating directory:', itemDirPath)
    await this.ensureDirExists(itemDirPath)

    // Determine file extension from the filename
    const extension = thumbnailData.filename.split('.').pop() || 'jpg'
    const thumbnailFileName = `thumbnail.${extension}`
    const thumbnailPath = path.join(itemDirPath, thumbnailFileName)

    console.log('Saving thumbnail to:', thumbnailPath)

    try {
      // Convert ArrayBuffer to Buffer
      const buffer = Buffer.from(thumbnailData.buffer)
      console.log('Buffer created successfully, size:', buffer.length)

      await fs.writeFile(thumbnailPath, buffer)
      console.log(`Thumbnail saved successfully to: ${thumbnailPath}`)

      // Verify the file was written
      const stats = await fs.stat(thumbnailPath)
      console.log('File verification - size:', stats.size, 'bytes')

      return true
    } catch (error) {
      console.error(`Failed to save thumbnail for ${libraryItemId}:`, error)
      return false
    }
  }

  async getThumbnailPath(libraryItemId: string): Promise<string | null> {
    const itemDirPath = path.join(FASEEH_BASE_PATH, LIBRARY_DIR_NAME, libraryItemId)

    // Check for common thumbnail extensions
    const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']

    for (const ext of extensions) {
      const thumbnailPath = path.join(itemDirPath, `thumbnail.${ext}`)
      try {
        await fs.access(thumbnailPath)
        return thumbnailPath // Return absolute path if file exists
      } catch {
        // File doesn't exist, try next extension
      }
    }

    return null // No thumbnail found
  }

  async deleteThumbnail(libraryItemId: string): Promise<boolean> {
    const itemDirPath = path.join(FASEEH_BASE_PATH, LIBRARY_DIR_NAME, libraryItemId)

    // Check for common thumbnail extensions and delete if found
    const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    let deleted = false

    for (const ext of extensions) {
      const thumbnailPath = path.join(itemDirPath, `thumbnail.${ext}`)
      try {
        await fs.unlink(thumbnailPath)
        deleted = true
      } catch {
        // File doesn't exist or couldn't be deleted, continue
      }
    }

    return deleted
  }

  async getThumbnailData(
    libraryItemId: string
  ): Promise<{ buffer: ArrayBuffer; type: string } | null> {
    const thumbnailPath = await this.getThumbnailPath(libraryItemId)
    if (!thumbnailPath) {
      return null
    }

    try {
      const buffer = await fs.readFile(thumbnailPath)

      // Determine MIME type based on file extension
      const ext = path.extname(thumbnailPath).toLowerCase()
      let mimeType = 'image/jpeg' // default

      switch (ext) {
        case '.png':
          mimeType = 'image/png'
          break
        case '.gif':
          mimeType = 'image/gif'
          break
        case '.webp':
          mimeType = 'image/webp'
          break
        case '.jpg':
        case '.jpeg':
        default:
          mimeType = 'image/jpeg'
          break
      }
      return {
        buffer: buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength
        ) as ArrayBuffer,
        type: mimeType
      }
    } catch (error) {
      console.error('Error reading thumbnail file:', error)
      return null
    }
  }

  // == PluginData (Database) ==

  async getPluginDataEntries(
    pluginId: string,
    key?: string,
    libraryItemId?: string | null
  ): Promise<any[]> {
    let query = this.db.selectFrom('pluginData').selectAll().where('pluginId', '=', pluginId)

    if (key !== undefined) {
      query = query.where('key', '=', key)
    }
    if (libraryItemId !== undefined) {
      // Handles both specific libraryItemId and null for global plugin data
      query = query.where('libraryItemId', libraryItemId === null ? 'is' : '=', libraryItemId)
    }
    return await query.orderBy('id').execute()
  }

  async getPluginDataEntryById(id: number): Promise<any> {
    return await this.db
      .selectFrom('pluginData')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()
  }

  async createPluginDataEntry(data: any): Promise<any> {
    return await this.db
      .insertInto('pluginData')
      .values({ ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
      .returningAll()
      .executeTakeFirst()
  }

  async updatePluginDataEntry(id: number, dataUpdate: any): Promise<any> {
    return await this.db
      .updateTable('pluginData')
      .set({ ...dataUpdate, updatedAt: new Date().toISOString() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst()
  }

  async deletePluginDataEntry(id: number): Promise<boolean> {
    const result = await this.db.deleteFrom('pluginData').where('id', '=', id).executeTakeFirst()
    return result.numDeletedRows > 0
  }

  async deletePluginDataEntriesByKey(
    pluginId: string,
    key: string,
    libraryItemId?: string | null
  ): Promise<number> {
    let query = this.db
      .deleteFrom('pluginData')
      .where('pluginId', '=', pluginId)
      .where('key', '=', key)

    if (libraryItemId !== undefined) {
      query = query.where('libraryItemId', libraryItemId === null ? 'is' : '=', libraryItemId)
    }
    const result = await query.executeTakeFirst()
    return Number(result.numDeletedRows) || 0
  }

  // == Plugin File Data (Filesystem) ==

  async readPluginManifest(pluginId: string): Promise<PluginManifest | undefined> {
    const manifestPath = path.join(
      (await this.getPluginDirectoryPath(pluginId)) || '',
      MANIFEST_FILE_NAME
    )
    try {
      const content = await fs.readFile(manifestPath, 'utf-8')
      return JSON.parse(content) as PluginManifest
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return undefined
      }
      console.error(`Failed to read plugin manifest for ${pluginId}:`, error)
      throw error
    }
  }

  async readPluginDataFile(pluginId: string, relativePath: string): Promise<string | undefined> {
    if (!pluginId || !relativePath) return undefined
    const pluginBaseDir = path.join(
      FASEEH_BASE_PATH,
      PLUGINS_DIR_NAME,
      pluginId,
      PLUGIN_DATA_SUBDIR_NAME
    )
    const filePath = path.join(pluginBaseDir, relativePath)
    try {
      return await fs.readFile(filePath, 'utf-8')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return undefined
      }
      console.error(`Failed to read plugin data file ${filePath}:`, error)
      throw error
    }
  }

  async writePluginDataFile(
    pluginId: string,
    relativePath: string,
    content: string
  ): Promise<boolean> {
    if (!pluginId || !relativePath) return false
    const pluginBaseDir = path.join(
      FASEEH_BASE_PATH,
      PLUGINS_DIR_NAME,
      pluginId,
      PLUGIN_DATA_SUBDIR_NAME
    )
    const filePath = path.join(pluginBaseDir, relativePath)
    try {
      await this.ensureDirExists(path.dirname(filePath)) // Ensure parent directory of the file exists
      await fs.writeFile(filePath, content, 'utf-8')
      return true
    } catch (error) {
      console.error(`Failed to write plugin data file ${filePath}:`, error)
      return false
    }
  }

  async deletePluginDataFile(pluginId: string, relativePath: string): Promise<boolean> {
    if (!pluginId || !relativePath) return false
    const pluginBaseDir = path.join(
      FASEEH_BASE_PATH,
      PLUGINS_DIR_NAME,
      pluginId,
      PLUGIN_DATA_SUBDIR_NAME
    )
    const filePath = path.join(pluginBaseDir, relativePath)
    try {
      await fs.unlink(filePath)
      // Optionally, try to remove empty parent directories here if desired
      return true
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return false // File didn't exist, so "deletion" is effectively true or false depending on desired semantics
      }
      console.error(`Failed to delete plugin data file ${filePath}:`, error)
      return false
    }
  }

  async listPluginDataFiles(pluginId: string, subDirectory?: string): Promise<string[]> {
    if (!pluginId) return []
    const pluginDataDir = path.join(
      FASEEH_BASE_PATH,
      PLUGINS_DIR_NAME,
      pluginId,
      PLUGIN_DATA_SUBDIR_NAME
    )
    const targetDir = subDirectory ? path.join(pluginDataDir, subDirectory) : pluginDataDir

    try {
      await fs.access(targetDir) // Check if directory exists
      const entries = await fs.readdir(targetDir, { withFileTypes: true })
      // TODO: Return names for now, later on we could return more detailed info (isFile, isDirectory)
      return entries.map((entry) => entry.name)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [] // Directory doesn't exist
      }
      console.error(`Failed to list plugin data files in ${targetDir}:`, error)
      throw error
    }
  }

  // == AppSettings (Database) ==

  async getAppSetting(key: string): Promise<any> {
    return await this.db
      .selectFrom('appSettings')
      .selectAll()
      .where('key', '=', key)
      .executeTakeFirst()
  }

  async getAllAppSettings(): Promise<any[]> {
    return await this.db.selectFrom('appSettings').selectAll().orderBy('key').execute()
  }

  async setAppSetting(setting: any): Promise<any> {
    const { key, value } = setting
    const now = new Date().toISOString()

    return await this.db
      .insertInto('appSettings')
      .values({ key, value, createdAt: now, updatedAt: now })
      .onConflict((oc) => oc.column('key').doUpdateSet({ value, updatedAt: now }))
      .returningAll()
      .executeTakeFirstOrThrow()
  }

  async deleteAppSetting(key: string): Promise<boolean> {
    const result = await this.db.deleteFrom('appSettings').where('key', '=', key).executeTakeFirst()
    return result.numDeletedRows > 0
  }

  // == Specific Config Files (Filesystem) ==

  async getEnabledPluginIds(): Promise<string[]> {
    const filePath = path.join(FASEEH_BASE_PATH, CONFIG_DIR_NAME, ENABLED_PLUGINS_FILE_NAME)
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      return JSON.parse(content) as string[]
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [] // File doesn't exist, return empty array
      }
      console.error(`Failed to read ${ENABLED_PLUGINS_FILE_NAME}:`, error)
      throw error
    }
  }

  async setEnabledPluginIds(pluginIds: string[]): Promise<boolean> {
    const filePath = path.join(FASEEH_BASE_PATH, CONFIG_DIR_NAME, ENABLED_PLUGINS_FILE_NAME)
    try {
      await fs.writeFile(filePath, JSON.stringify(pluginIds, null, 2), 'utf-8')
      return true
    } catch (error) {
      console.error(`Failed to write ${ENABLED_PLUGINS_FILE_NAME}:`, error)
      return false
    }
  }

  // == ContentGroups ==

  async getContentGroups(): Promise<any[]> {
    return await this.db.selectFrom('contentGroups').selectAll().orderBy('name').execute()
  }

  async getContentGroupById(id: string): Promise<any> {
    return await this.db
      .selectFrom('contentGroups')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()
  }

  async createContentGroup(group: any): Promise<any> {
    const now = new Date().toISOString()
    return await this.db
      .insertInto('contentGroups')
      .values({ ...group, createdAt: now, updatedAt: now })
      .returningAll()
      .executeTakeFirst()
  }

  async updateContentGroup(id: string, groupUpdate: any): Promise<any> {
    const now = new Date().toISOString()
    return await this.db
      .updateTable('contentGroups')
      .set({ ...groupUpdate, updatedAt: now })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst()
  }

  async deleteContentGroup(id: string): Promise<boolean> {
    const result = await this.db.deleteFrom('contentGroups').where('id', '=', id).executeTakeFirst()
    return result.numDeletedRows > 0
  }

  // == Collections ==

  async getCollections(): Promise<any[]> {
    return await this.db.selectFrom('collections').selectAll().orderBy('name').execute()
  }

  async getCollectionById(id: string): Promise<any> {
    return await this.db
      .selectFrom('collections')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()
  }

  async createCollection(collection: any): Promise<any> {
    const now = new Date().toISOString()
    return await this.db
      .insertInto('collections')
      .values({ ...collection, createdAt: now, updatedAt: now })
      .returningAll()
      .executeTakeFirst()
  }

  async updateCollection(id: string, collectionUpdate: any): Promise<any> {
    const now = new Date().toISOString()
    return await this.db
      .updateTable('collections')
      .set({ ...collectionUpdate, updatedAt: now })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst()
  }

  async deleteCollection(id: string): Promise<boolean> {
    // Also delete associated collection members
    await this.db.deleteFrom('collectionMembers').where('collectionId', '=', id).execute()
    const result = await this.db.deleteFrom('collections').where('id', '=', id).executeTakeFirst()
    return result.numDeletedRows > 0
  }

  // == CollectionMembers ==

  async getCollectionMembers(collectionId: string): Promise<any[]> {
    return await this.db
      .selectFrom('collectionMembers')
      .selectAll()
      .where('collectionId', '=', collectionId)
      .orderBy('itemOrder', 'asc')
      .execute()
  }

  async getCollectionsForMember(itemId: string, itemType: string): Promise<any[]> {
    return await this.db
      .selectFrom('collectionMembers')
      .selectAll()
      .where('itemId', '=', itemId)
      .where('itemType', '=', itemType)
      .execute()
  }

  async addCollectionMember(member: any): Promise<any> {
    // If 'order' is not provided, set it to a high number or count of existing items + 1
    let itemOrder = member.itemOrder
    if (itemOrder === undefined || itemOrder === null) {
      const maxOrderResult = await this.db
        .selectFrom('collectionMembers')
        .select(this.db.fn.max('itemOrder').as('maxOrder'))
        .where('collectionId', '=', member.collectionId)
        .executeTakeFirst()
      itemOrder = (maxOrderResult?.maxOrder || 0) + 1
    }

    return await this.db
      .insertInto('collectionMembers')
      .values({ ...member, itemOrder })
      .returningAll()
      .executeTakeFirst()
  }

  async updateCollectionMemberOrder(
    collectionId: string,
    itemId: string,
    itemType: string,
    newOrder: number
  ): Promise<boolean> {
    const result = await this.db
      .updateTable('collectionMembers')
      .set({ itemOrder: newOrder })
      .where('collectionId', '=', collectionId)
      .where('itemId', '=', itemId)
      .where('itemType', '=', itemType)
      .executeTakeFirst()
    return result.numUpdatedRows > 0
  }

  async removeCollectionMember(
    collectionId: string,
    itemId: string,
    itemType: string
  ): Promise<boolean> {
    const result = await this.db
      .deleteFrom('collectionMembers')
      .where('collectionId', '=', collectionId)
      .where('itemId', '=', itemId)
      .where('itemType', '=', itemType)
      .executeTakeFirst()
    return result.numDeletedRows > 0
  }

  // == VocabularyRegistry ==

  async getVocabularyEntries(language?: string, text?: string): Promise<any[]> {
    let query = this.db.selectFrom('vocabularyRegistry').selectAll()
    if (language) {
      query = query.where('language', '=', language)
    }
    if (text) {
      // Use 'like' for partial matches or '=' for exact, depending on needs
      query = query.where('text', 'like', `%${text}%`)
    }
    return await query.orderBy('text').execute()
  }

  async getVocabularyEntryById(id: string): Promise<any> {
    return await this.db
      .selectFrom('vocabularyRegistry')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()
  }

  async findOrCreateVocabularyEntry(entry: any): Promise<any> {
    const now = new Date().toISOString()
    // Attempt to find first
    const existing = await this.db
      .selectFrom('vocabularyRegistry')
      .selectAll()
      .where('text', '=', entry.text)
      .where('language', '=', entry.language)
      .executeTakeFirst()

    if (existing) {
      return existing
    }
    // Create if not found
    // Generate ID if your DB doesn't do it automatically or if you use UUIDs
    const newId = crypto.randomUUID() // Assuming UUIDs for IDs
    return await this.db
      .insertInto('vocabularyRegistry')
      .values({ ...entry, id: newId, createdAt: now })
      .returningAll()
      .executeTakeFirst()
  }

  async updateVocabularyEntry(id: string, entryUpdate: any): Promise<any> {
    return await this.db
      .updateTable('vocabularyRegistry')
      .set({ ...entryUpdate })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst()
  }

  async deleteVocabularyEntry(id: string): Promise<boolean> {
    // Also delete associated vocabulary sources
    await this.db.deleteFrom('vocabularySources').where('vocabularyId', '=', id).execute()
    const result = await this.db
      .deleteFrom('vocabularyRegistry')
      .where('id', '=', id)
      .executeTakeFirst()
    return result.numDeletedRows > 0
  }

  // == VocabularySources ==

  async getVocabularySources(filters: any): Promise<any[]> {
    let query = this.db.selectFrom('vocabularySources').selectAll()
    if (filters.vocabularyId) {
      query = query.where('vocabularyId', '=', filters.vocabularyId)
    }
    if (filters.libraryItemId) {
      query = query.where('libraryItemId', '=', filters.libraryItemId)
    }
    return await query.execute()
  }

  async addVocabularySource(source: any): Promise<any> {
    // Kysely doesn't directly support returning from composite primary key inserts without specific DB features.
    // We'll insert and then select, or assume the insert was successful if no error.
    // For simplicity, we'll just insert. If you need the inserted row, you might need to query it back.
    // Or, if your DB supports it, use a CTE with RETURNING.
    await this.db
      .insertInto('vocabularySources')
      .values({ ...source })
      .executeTakeFirstOrThrow() // Throws if insert fails

    // To return the inserted row (less efficient but works across DBs):
    return await this.db
      .selectFrom('vocabularySources')
      .selectAll()
      .where('vocabularyId', '=', source.vocabularyId)
      .where('libraryItemId', '=', source.libraryItemId)
      .where('contextSentence', '=', source.contextSentence ?? null) // Assuming context helps make it unique enough for this re-query
      .executeTakeFirst()
  }

  async deleteVocabularySources(criteria: any): Promise<number> {
    let query = this.db.deleteFrom('vocabularySources')
    if (criteria.vocabularyId) {
      query = query.where('vocabularyId', '=', criteria.vocabularyId)
    }
    if (criteria.libraryItemId) {
      query = query.where('libraryItemId', '=', criteria.libraryItemId)
    }
    const result = await query.executeTakeFirst()
    return Number(result.numDeletedRows) || 0
  }

  // == EmbeddedAssets ==

  async getEmbeddedAssetsByLibraryItem(libraryItemId: string): Promise<any[]> {
    return await this.db
      .selectFrom('embeddedAssets')
      .selectAll()
      .where('libraryItemId', '=', libraryItemId)
      .orderBy('originalSrc')
      .execute()
  }

  async getEmbeddedAssetById(id: string): Promise<any> {
    return await this.db
      .selectFrom('embeddedAssets')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()
  }

  async createEmbeddedAsset(asset: any): Promise<any> {
    const now = new Date().toISOString()
    // The actual file saving (from blob/temp path to storagePath) is complex
    // and not fully defined by this API. This method assumes the file is already
    // or will be placed at the location indicated by `storagePath` relative to the item's asset dir.
    // `storagePath` should ideally be just the filename.
    const itemAssetDir = path.join(
      FASEEH_BASE_PATH,
      LIBRARY_DIR_NAME,
      asset.libraryItemId,
      EMBEDDED_ASSETS_DIR_NAME
    )
    await this.ensureDirExists(itemAssetDir)
    // Here, you might copy a file from a temporary location to:
    // path.join(itemAssetDir, asset.storagePath)
    // For now, we just create the DB record.

    const newId = asset.id || crypto.randomUUID() // Ensure ID exists
    return await this.db
      .insertInto('embeddedAssets')
      .values({ ...asset, id: newId, createdAt: now })
      .returningAll()
      .executeTakeFirst()
  }

  async updateEmbeddedAsset(id: string, assetUpdate: any): Promise<any> {
    // If storagePath changes, old file might need to be deleted / new one moved.
    // This logic is not included here for brevity.
    return await this.db
      .updateTable('embeddedAssets')
      .set({ ...assetUpdate })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst()
  }

  async deleteEmbeddedAsset(id: string): Promise<boolean> {
    const asset = await this.getEmbeddedAssetById(id)
    if (!asset) return false

    const result = await this.db
      .deleteFrom('embeddedAssets')
      .where('id', '=', id)
      .executeTakeFirst()
    if (result.numDeletedRows > 0 && asset.libraryItemId && asset.storagePath) {
      const filePath = path.join(
        FASEEH_BASE_PATH,
        LIBRARY_DIR_NAME,
        asset.libraryItemId,
        EMBEDDED_ASSETS_DIR_NAME,
        asset.storagePath
      )
      try {
        await fs.unlink(filePath)
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          console.error(`Failed to delete embedded asset file ${filePath}:`, error)
          // Decide if this should make the overall operation fail
        }
      }
    }
    return result.numDeletedRows > 0
  }

  // == SupplementaryFiles ==

  async getSupplementaryFilesByLibraryItem(
    libraryItemId: string,
    type?: string,
    language?: string
  ): Promise<any[]> {
    let query = this.db
      .selectFrom('supplementaryFiles')
      .selectAll()
      .where('libraryItemId', '=', libraryItemId)
    if (type) {
      query = query.where('type', '=', type)
    }
    if (language) {
      query = query.where('language', '=', language)
    }
    return await query.orderBy('filename').execute()
  }

  async getSupplementaryFileById(id: string): Promise<any> {
    return await this.db
      .selectFrom('supplementaryFiles')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()
  }

  async createSupplementaryFile(file: any): Promise<any> {
    const now = new Date().toISOString()
    // Similar to EmbeddedAssets, file handling logic (copying from temp) is omitted.
    // `storagePath` should be just the filename.
    const itemSuppDir = path.join(
      FASEEH_BASE_PATH,
      LIBRARY_DIR_NAME,
      file.libraryItemId,
      SUPPLEMENTARY_FILES_DIR_NAME
    )
    await this.ensureDirExists(itemSuppDir)

    const newId = file.id || crypto.randomUUID() // Ensure ID exists
    return await this.db
      .insertInto('supplementaryFiles')
      .values({ ...file, id: newId, createdAt: now })
      .returningAll()
      .executeTakeFirst()
  }

  async updateSupplementaryFile(id: string, fileUpdate: any): Promise<any> {
    return await this.db
      .updateTable('supplementaryFiles')
      .set({ ...fileUpdate })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst()
  }

  async deleteSupplementaryFile(id: string): Promise<boolean> {
    const file = await this.getSupplementaryFileById(id)
    if (!file) return false

    const result = await this.db
      .deleteFrom('supplementaryFiles')
      .where('id', '=', id)
      .executeTakeFirst()

    if (result.numDeletedRows > 0 && file.libraryItemId && file.storagePath) {
      const filePath = path.join(
        FASEEH_BASE_PATH,
        LIBRARY_DIR_NAME,
        file.libraryItemId,
        SUPPLEMENTARY_FILES_DIR_NAME,
        file.storagePath
      )
      try {
        await fs.unlink(filePath)
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          console.error(`Failed to delete supplementary file ${filePath}:`, error)
        }
      }
    }
    return result.numDeletedRows > 0
  }

  async writeSupplementaryFileContent(
    libraryItemId: string,
    filename: string,
    content: string
  ): Promise<boolean> {
    if (!libraryItemId || !filename) return false

    const itemSuppDir = path.join(
      FASEEH_BASE_PATH,
      LIBRARY_DIR_NAME,
      libraryItemId,
      SUPPLEMENTARY_FILES_DIR_NAME
    )
    await this.ensureDirExists(itemSuppDir)

    const filePath = path.join(itemSuppDir, filename)
    try {
      await fs.writeFile(filePath, content, 'utf-8')
      return true
    } catch (error) {
      console.error(`Failed to write supplementary file ${filePath}:`, error)
      return false
    }
  }
}

/**
 * Singleton instance of the main process storage service.
 *
 * This is the primary storage service instance for the main process, initialized with
 * the application database connection. All IPC handlers for storage operations are
 * automatically registered when this instance is created.
 *
 * @example
 * ```typescript
 * const items = await storage.getLibraryItems()
 *
 * // Listen for storage events
 * storage.on('library-item-created', (item) => {
 *   console.log('Library item created:', item)
 * })
 * ```
 *
 * @internal
 */
export const storage = new StorageService(db)
