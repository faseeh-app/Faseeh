import {
  AppSettings,
  AppSettingsUpdate,
  Collection,
  CollectionMember,
  CollectionUpdate,
  ContentGroup,
  ContentGroupUpdate,
  EmbeddedAsset,
  EmbeddedAssetUpdate,
  LibraryItem,
  LibraryItemUpdate,
  NewAppSettings,
  NewCollection,
  NewCollectionMember,
  NewContentGroup,
  NewEmbeddedAsset,
  NewLibraryItem,
  NewPluginData,
  NewSupplementaryFile,
  NewVocabularyRegistry,
  NewVocabularySource,
  PluginData,
  PluginDataUpdate,
  SupplementaryFile,
  SupplementaryFileUpdate,
  VocabularyRegistry,
  VocabularyRegistryUpdate,
  VocabularySource
} from '@shared/types/db'
import { ContentDocument, EventBus, PluginManifest, StorageEvents } from '@shared/types/types'

/* -------------------------------------------------------------------------- */
/*                          Database Storage Types                            */
/* -------------------------------------------------------------------------- */

/**
 * StorageAPI provides a comprehensive interface for managing all data storage operations
 * in the Faseeh application. This includes database operations and file system management.
 * @internal
 */
export interface IStorageAPI extends EventBus<StorageEvents> {
  // == Path Management ==

  /**
   * Gets the absolute path to the main Faseeh application folder.
   * This folder contains all user data including library items, plugins, and configuration.
   *
   * @returns {Promise<string>} The absolute path to the Faseeh folder
   */
  getFaseehFolderPath: () => Promise<string>

  /**
   * Gets the absolute path to a specific library item's directory.
   * Returns undefined if the library item ID is invalid or the directory doesn't exist.
   *
   * @param {string} libraryItemId - The unique identifier of the library item
   * @returns {Promise<string | undefined>} The absolute path to the library item directory, or undefined if not found
   */
  getLibraryItemDirectoryPath: (libraryItemId: string) => Promise<string | undefined>

  /**
   * Gets the absolute path to an embedded asset file by its ID.
   * Queries the database to find the asset's storage path and constructs the full file path.
   *
   * @param {string} assetId - The unique identifier of the embedded asset
   * @returns {Promise<string | undefined>} The absolute path to the asset file, or undefined if not found
   */
  getEmbeddedAssetAbsolutePath: (assetId: string) => Promise<string | undefined>

  /**
   * Gets the absolute path to a supplementary file by its ID.
   * Queries the database to find the file's storage path and constructs the full file path.
   *
   * @param {string} fileId - The unique identifier of the supplementary file
   * @returns {Promise<string | undefined>} The absolute path to the supplementary file, or undefined if not found
   */
  getSupplementaryFileAbsolutePath: (fileId: string) => Promise<string | undefined>

  /**
   * Gets the absolute path to a plugin's directory.
   * Returns undefined if the plugin ID is invalid.
   *
   * @param {string} pluginId - The unique identifier of the plugin
   * @returns {Promise<string | undefined>} The absolute path to the plugin directory, or undefined if invalid ID
   */
  getPluginDirectoryPath: (pluginId: string) => Promise<string | undefined>

  /**
   * Lists all plugin directories in the plugins folder.
   * Returns an empty array if the plugins directory doesn't exist or can't be read.
   *
   * @returns {Promise<string[]>} Array of absolute paths to plugin directories
   */
  listPluginDirectories: () => Promise<string[]>

  /**
   * Gets the absolute path to the configuration directory.
   * This directory contains application settings and enabled plugins configuration.
   *
   * @returns {Promise<string | undefined>} The absolute path to the config directory
   */
  getConfigDirectoryPath: () => Promise<string | undefined>

  // == LibraryItems & Document.json ==

  /**
   * Retrieves library items from the database based on optional criteria.
   *
   * @param {Partial<LibraryItem>} [criteria] - Optional filtering criteria for the query
   * @returns {Promise<LibraryItem[]>} Array of library items matching the criteria
   */
  getLibraryItems: (criteria?: Partial<LibraryItem>) => Promise<LibraryItem[]>

  /**
   * Retrieves a specific library item by its unique identifier.
   *
   * @param {string} id - The unique identifier of the library item
   * @returns {Promise<LibraryItem | undefined>} The library item data, or undefined if not found
   */
  getLibraryItemById: (id: string) => Promise<LibraryItem | undefined>

  /**
   * Creates a new library item in the database and optionally saves associated document content.
   *
   * @param {NewLibraryItem} item - The library item data to create
   * @param {ContentDocument} [documentContent] - Optional document content to save alongside the item
   * @returns {Promise<LibraryItem | undefined>} The created library item with generated ID and timestamps
   */
  createLibraryItem: (
    item: NewLibraryItem,
    documentContent?: ContentDocument
  ) => Promise<LibraryItem | undefined>

  /**
   * Updates an existing library item with new data.
   *
   * @param {string} id - The unique identifier of the library item to update
   * @param {LibraryItemUpdate} itemUpdate - The updated data for the library item
   * @returns {Promise<LibraryItem | undefined>} The updated library item data
   */
  updateLibraryItem: (id: string, itemUpdate: LibraryItemUpdate) => Promise<LibraryItem | undefined>

  /**
   * Deletes a library item and all its associated data (assets, files, etc.).
   *
   * @param {string} id - The unique identifier of the library item to delete
   * @returns {Promise<boolean>} True if the deletion was successful, false otherwise
   */
  deleteLibraryItem: (id: string) => Promise<boolean>

  /**
   * Retrieves the document.json content for a specific library item.
   * This file contains the structured content data for the item.
   *
   * @param {string} libraryItemId - The unique identifier of the library item
   * @returns {Promise<ContentDocument | undefined>} The document content, or undefined if not found
   */
  getDocumentJson: (libraryItemId: string) => Promise<ContentDocument | undefined>

  /**
   * Saves document content to the document.json file for a library item.
   *
   * @param {string} libraryItemId - The unique identifier of the library item
   * @param {ContentDocument} content - The document content to save
   * @returns {Promise<boolean>} True if the save operation was successful, false otherwise
   */
  saveDocumentJson: (libraryItemId: string, content: ContentDocument) => Promise<boolean>

  // == PluginData (Database) ==

  /**
   * Retrieves plugin data entries from the database with optional filtering.
   *
   * @param {string} pluginId - The unique identifier of the plugin
   * @param {string} [key] - Optional key to filter entries by
   * @param {string | null} [libraryItemId] - Optional library item ID to filter entries by
   * @returns {Promise<PluginData[]>} Array of plugin data entries matching the criteria
   */
  getPluginDataEntries: (
    pluginId: string,
    key?: string,
    libraryItemId?: string | null
  ) => Promise<PluginData[]>

  /**
   * Retrieves a specific plugin data entry by its ID.
   *
   * @param {number} id - The unique identifier of the plugin data entry
   * @returns {Promise<PluginData | undefined>} The plugin data entry, or undefined if not found
   */
  getPluginDataEntryById: (id: number) => Promise<PluginData | undefined>

  /**
   * Creates a new plugin data entry in the database.
   *
   * @param {NewPluginData} data - The plugin data to store
   * @returns {Promise<PluginData | undefined>} The created plugin data entry with generated ID
   */
  createPluginDataEntry: (data: NewPluginData) => Promise<PluginData | undefined>

  /**
   * Updates an existing plugin data entry.
   *
   * @param {number} id - The unique identifier of the plugin data entry to update
   * @param {PluginDataUpdate} dataUpdate - The updated data
   * @returns {Promise<PluginData | undefined>} The updated plugin data entry
   */
  updatePluginDataEntry: (
    id: number,
    dataUpdate: PluginDataUpdate
  ) => Promise<PluginData | undefined>

  /**
   * Deletes a specific plugin data entry by its ID.
   *
   * @param {number} id - The unique identifier of the plugin data entry to delete
   * @returns {Promise<boolean>} True if the deletion was successful, false otherwise
   */
  deletePluginDataEntry: (id: number) => Promise<boolean>

  /**
   * Deletes all plugin data entries matching the specified criteria.
   *
   * @param {string} pluginId - The unique identifier of the plugin
   * @param {string} key - The key to match for deletion
   * @param {string | null} [libraryItemId] - Optional library item ID to filter deletions
   * @returns {Promise<number>} The number of entries deleted
   */
  deletePluginDataEntriesByKey: (
    pluginId: string,
    key: string,
    libraryItemId?: string | null
  ) => Promise<number>

  // == Plugin File Data (Filesystem) ==

  /**
   * Reads and parses a plugin's manifest.json file.
   * The manifest contains metadata about the plugin including its capabilities and requirements.
   *
   * @param {string} pluginId - The unique identifier of the plugin
   * @returns {Promise<PluginManifest | undefined>} The parsed manifest data, or undefined if not found or invalid
   */
  readPluginManifest: (pluginId: string) => Promise<PluginManifest | undefined>

  /**
   * Reads a plugin data file from the plugin's data directory.
   *
   * @param {string} pluginId - The unique identifier of the plugin
   * @param {string} relativePath - The relative path to the file within the plugin's data directory
   * @returns {Promise<string | undefined>} The file content as a string, or undefined if not found
   */
  readPluginDataFile: (pluginId: string, relativePath: string) => Promise<string | undefined>

  /**
   * Writes content to a plugin data file in the plugin's data directory.
   * Creates the file and any necessary parent directories if they don't exist.
   *
   * @param {string} pluginId - The unique identifier of the plugin
   * @param {string} relativePath - The relative path to the file within the plugin's data directory
   * @param {string} content - The content to write to the file
   * @returns {Promise<boolean>} True if the write operation was successful, false otherwise
   */
  writePluginDataFile: (pluginId: string, relativePath: string, content: string) => Promise<boolean>

  /**
   * Deletes a plugin data file from the plugin's data directory.
   *
   * @param {string} pluginId - The unique identifier of the plugin
   * @param {string} relativePath - The relative path to the file within the plugin's data directory
   * @returns {Promise<boolean>} True if the deletion was successful, false otherwise
   */
  deletePluginDataFile: (pluginId: string, relativePath: string) => Promise<boolean>

  /**
   * Lists all files in a plugin's data directory or a subdirectory within it.
   *
   * @param {string} pluginId - The unique identifier of the plugin
   * @param {string} [subDirectory] - Optional subdirectory to list files from
   * @returns {Promise<string[]>} Array of relative file paths within the plugin's data directory
   */
  listPluginDataFiles: (pluginId: string, subDirectory?: string) => Promise<string[]>

  // == AppSettings (Database - for settings.json like data) ==

  /**
   * Retrieves a specific application setting by its key.
   *
   * @param {string} key - The unique key of the setting to retrieve
   * @returns {Promise<AppSettings | undefined>} The setting data, or undefined if not found
   */
  getAppSetting: (key: string) => Promise<AppSettings | undefined>

  /**
   * Retrieves all application settings from the database.
   *
   * @returns {Promise<AppSettings[]>} Array of all application settings
   */
  getAllAppSettings: () => Promise<AppSettings[]>

  /**
   * Sets or updates an application setting in the database.
   * Creates a new setting if it doesn't exist, or updates the existing one.
   *
   * @param {NewAppSettings | AppSettingsUpdate} setting - The setting data to save (must include key and value)
   * @returns {Promise<AppSettings | undefined>} The saved setting data
   */
  setAppSetting: (setting: NewAppSettings | AppSettingsUpdate) => Promise<AppSettings | undefined>

  /**
   * Deletes an application setting by its key.
   *
   * @param {string} key - The unique key of the setting to delete
   * @returns {Promise<boolean>} True if the deletion was successful, false otherwise
   */
  deleteAppSetting: (key: string) => Promise<boolean>

  // == Specific Config Files (Filesystem) ==

  /**
   * Retrieves the list of enabled plugin IDs from the configuration file.
   * Returns an empty array if the configuration file doesn't exist or is invalid.
   *
   * @returns {Promise<string[]>} Array of enabled plugin IDs
   */
  getEnabledPluginIds: () => Promise<string[]>

  /**
   * Sets the list of enabled plugin IDs in the configuration file.
   * This determines which plugins are loaded and active in the application.
   *
   * @param {string[]} pluginIds - Array of plugin IDs to enable
   * @returns {Promise<boolean>} True if the save operation was successful, false otherwise
   */
  setEnabledPluginIds: (pluginIds: string[]) => Promise<boolean>

  // == ContentGroups ==

  /**
   * Retrieves all content groups from the database.
   * Content groups are used to organize and categorize library items.
   *
   * @returns {Promise<ContentGroup[]>} Array of all content groups
   */
  getContentGroups: () => Promise<ContentGroup[]>

  /**
   * Retrieves a specific content group by its ID.
   *
   * @param {string} id - The unique identifier of the content group
   * @returns {Promise<ContentGroup | undefined>} The content group data, or undefined if not found
   */
  getContentGroupById: (id: string) => Promise<ContentGroup | undefined>

  /**
   * Creates a new content group in the database.
   *
   * @param {NewContentGroup} group - The content group data to create
   * @returns {Promise<ContentGroup | undefined>} The created content group with generated ID and timestamps
   */
  createContentGroup: (group: NewContentGroup) => Promise<ContentGroup | undefined>

  /**
   * Updates an existing content group with new data.
   *
   * @param {string} id - The unique identifier of the content group to update
   * @param {ContentGroupUpdate} groupUpdate - The updated data for the content group
   * @returns {Promise<ContentGroup | undefined>} The updated content group data
   */
  updateContentGroup: (
    id: string,
    groupUpdate: ContentGroupUpdate
  ) => Promise<ContentGroup | undefined>

  /**
   * Deletes a content group by its ID.
   * This operation may fail if the group is referenced by library items.
   *
   * @param {string} id - The unique identifier of the content group to delete
   * @returns {Promise<boolean>} True if the deletion was successful, false otherwise
   */
  deleteContentGroup: (id: string) => Promise<boolean>

  // == Collections ==

  /**
   * Retrieves all collections from the database.
   * Collections are user-defined groups that can contain multiple library items.
   *
   * @returns {Promise<Collection[]>} Array of all collections
   */
  getCollections: () => Promise<Collection[]>

  /**
   * Retrieves a specific collection by its ID.
   *
   * @param {string} id - The unique identifier of the collection
   * @returns {Promise<Collection | undefined>} The collection data, or undefined if not found
   */
  getCollectionById: (id: string) => Promise<Collection | undefined>

  /**
   * Creates a new collection in the database.
   *
   * @param {NewCollection} collection - The collection data to create
   * @returns {Promise<Collection | undefined>} The created collection with generated ID and timestamps
   */
  createCollection: (collection: NewCollection) => Promise<Collection | undefined>

  /**
   * Updates an existing collection with new data.
   *
   * @param {string} id - The unique identifier of the collection to update
   * @param {CollectionUpdate} collectionUpdate - The updated data for the collection
   * @returns {Promise<Collection | undefined>} The updated collection data
   */
  updateCollection: (
    id: string,
    collectionUpdate: CollectionUpdate
  ) => Promise<Collection | undefined>

  /**
   * Deletes a collection by its ID.
   * This also removes all collection members associated with this collection.
   *
   * @param {string} id - The unique identifier of the collection to delete
   * @returns {Promise<boolean>} True if the deletion was successful, false otherwise
   */
  deleteCollection: (id: string) => Promise<boolean>

  // == CollectionMembers ==

  /**
   * Retrieves all members of a specific collection.
   * Collection members can be library items or other entities that belong to the collection.
   *
   * @param {string} collectionId - The unique identifier of the collection
   * @returns {Promise<CollectionMember[]>} Array of collection members with their order and metadata
   */
  getCollectionMembers: (collectionId: string) => Promise<CollectionMember[]>

  /**
   * Retrieves all collections that contain a specific item as a member.
   *
   * @param {string} itemId - The unique identifier of the item
   * @param {string} itemType - The type of the item (e.g., 'libraryItem', 'vocabularyEntry')
   * @returns {Promise<CollectionMember[]>} Array of collections containing this item
   */
  getCollectionsForMember: (itemId: string, itemType: string) => Promise<CollectionMember[]>

  /**
   * Adds a new member to a collection.
   * The member is assigned an order value for positioning within the collection.
   *
   * @param {NewCollectionMember} member - The collection member data (must include collectionId, itemId, itemType)
   * @returns {Promise<CollectionMember | undefined>} The created collection member with generated metadata
   */
  addCollectionMember: (member: NewCollectionMember) => Promise<CollectionMember | undefined>

  /**
   * Updates the order of a specific member within a collection.
   * This is used for reordering items in the collection.
   *
   * @param {string} collectionId - The unique identifier of the collection
   * @param {string} itemId - The unique identifier of the item
   * @param {string} itemType - The type of the item
   * @param {number} newOrder - The new order value for the member
   * @returns {Promise<boolean>} True if the update was successful, false otherwise
   */
  updateCollectionMemberOrder: (
    collectionId: string,
    itemId: string,
    itemType: string,
    newOrder: number
  ) => Promise<boolean>

  /**
   * Removes a member from a collection.
   *
   * @param {string} collectionId - The unique identifier of the collection
   * @param {string} itemId - The unique identifier of the item to remove
   * @param {string} itemType - The type of the item
   * @returns {Promise<boolean>} True if the removal was successful, false otherwise
   */
  removeCollectionMember: (
    collectionId: string,
    itemId: string,
    itemType: string
  ) => Promise<boolean>

  // == VocabularyRegistry ==

  /**
   * Retrieves vocabulary entries from the database with optional filtering.
   * The vocabulary registry stores words, phrases, and their associated metadata.
   *
   * @param {string} [language] - Optional language code to filter entries by
   * @param {string} [text] - Optional text to search for in vocabulary entries
   * @returns {Promise<VocabularyRegistry[]>} Array of vocabulary entries matching the criteria
   */
  getVocabularyEntries: (language?: string, text?: string) => Promise<VocabularyRegistry[]>

  /**
   * Retrieves a specific vocabulary entry by its ID.
   *
   * @param {string} id - The unique identifier of the vocabulary entry
   * @returns {Promise<VocabularyRegistry | undefined>} The vocabulary entry data, or undefined if not found
   */
  getVocabularyEntryById: (id: string) => Promise<VocabularyRegistry | undefined>

  /**
   * Finds an existing vocabulary entry or creates a new one if it doesn't exist.
   * This is used to avoid duplicate entries for the same word/phrase combination.
   *
   * @param {Pick<NewVocabularyRegistry, 'text' | 'language'>} entry - The vocabulary entry data to find or create
   * @returns {Promise<VocabularyRegistry | undefined>} The found or created vocabulary entry
   */
  findOrCreateVocabularyEntry: (
    entry: Pick<NewVocabularyRegistry, 'text' | 'language'>
  ) => Promise<VocabularyRegistry | undefined>

  /**
   * Updates an existing vocabulary entry with new data.
   *
   * @param {string} id - The unique identifier of the vocabulary entry to update
   * @param {VocabularyRegistryUpdate} entryUpdate - The updated data for the vocabulary entry
   * @returns {Promise<VocabularyRegistry | undefined>} The updated vocabulary entry data
   */
  updateVocabularyEntry: (
    id: string,
    entryUpdate: VocabularyRegistryUpdate
  ) => Promise<VocabularyRegistry | undefined>

  /**
   * Deletes a vocabulary entry by its ID.
   * This also removes all associated vocabulary sources for this entry.
   *
   * @param {string} id - The unique identifier of the vocabulary entry to delete
   * @returns {Promise<boolean>} True if the deletion was successful, false otherwise
   */
  deleteVocabularyEntry: (id: string) => Promise<boolean>

  // == VocabularySources ==

  /**
   * Retrieves vocabulary sources from the database with optional filtering.
   * Vocabulary sources track where vocabulary entries were encountered (e.g., specific library items).
   *
   * @param {object} filters - Filtering criteria for the query
   * @param {string} [filters.vocabularyId] - Optional vocabulary entry ID to filter by
   * @param {string} [filters.libraryItemId] - Optional library item ID to filter by
   * @returns {Promise<VocabularySource[]>} Array of vocabulary sources matching the criteria
   */
  getVocabularySources: (filters: {
    vocabularyId?: string
    libraryItemId?: string
  }) => Promise<VocabularySource[]>

  /**
   * Adds a new vocabulary source to the database.
   * This creates a link between a vocabulary entry and its source location.
   *
   * @param {NewVocabularySource} source - The vocabulary source data to create
   * @returns {Promise<VocabularySource | undefined>} The created vocabulary source with generated metadata
   */
  addVocabularySource: (source: NewVocabularySource) => Promise<VocabularySource | undefined>

  /**
   * Deletes vocabulary sources based on specified criteria.
   * This is useful for cleaning up sources when library items are deleted.
   *
   * @param {Partial<Pick<VocabularySource, 'vocabularyId' | 'libraryItemId'>>} criteria - The criteria for selecting sources to delete
   * @returns {Promise<number>} The number of vocabulary sources deleted
   */
  deleteVocabularySources: (
    criteria: Partial<Pick<VocabularySource, 'vocabularyId' | 'libraryItemId'>>
  ) => Promise<number>

  // == EmbeddedAssets ==

  /**
   * Retrieves all embedded assets associated with a specific library item.
   * Embedded assets are media files (images, audio, video) that are part of the content.
   *
   * @param {string} libraryItemId - The unique identifier of the library item
   * @returns {Promise<EmbeddedAsset[]>} Array of embedded assets for the library item
   */
  getEmbeddedAssetsByLibraryItem: (libraryItemId: string) => Promise<EmbeddedAsset[]>

  /**
   * Retrieves a specific embedded asset by its ID.
   *
   * @param {string} id - The unique identifier of the embedded asset
   * @returns {Promise<EmbeddedAsset | undefined>} The embedded asset data, or undefined if not found
   */
  getEmbeddedAssetById: (id: string) => Promise<EmbeddedAsset | undefined>

  /**
   * Creates a new embedded asset record in the database.
   * The actual file should be saved to the filesystem separately.
   *
   * @param {NewEmbeddedAsset} asset - The embedded asset data to create
   * @returns {Promise<EmbeddedAsset | undefined>} The created embedded asset with generated ID and metadata
   */
  createEmbeddedAsset: (asset: NewEmbeddedAsset) => Promise<EmbeddedAsset | undefined>

  /**
   * Updates an existing embedded asset with new metadata.
   *
   * @param {string} id - The unique identifier of the embedded asset to update
   * @param {EmbeddedAssetUpdate} assetUpdate - The updated data for the embedded asset
   * @returns {Promise<EmbeddedAsset | undefined>} The updated embedded asset data
   */
  updateEmbeddedAsset: (
    id: string,
    assetUpdate: EmbeddedAssetUpdate
  ) => Promise<EmbeddedAsset | undefined>

  /**
   * Deletes an embedded asset by its ID.
   * This removes the database record but does not delete the actual file.
   *
   * @param {string} id - The unique identifier of the embedded asset to delete
   * @returns {Promise<boolean>} True if the deletion was successful, false otherwise
   */
  deleteEmbeddedAsset: (id: string) => Promise<boolean>

  // == SupplementaryFiles ==

  /**
   * Retrieves supplementary files associated with a specific library item.
   * Supplementary files include translations, transcripts, annotations, and other supporting documents.
   *
   * @param {string} libraryItemId - The unique identifier of the library item
   * @param {string} [type] - Optional file type to filter by (e.g., 'translation', 'transcript')
   * @param {string} [language] - Optional language code to filter by
   * @returns {Promise<SupplementaryFile[]>} Array of supplementary files matching the criteria
   */
  getSupplementaryFilesByLibraryItem: (
    libraryItemId: string,
    type?: string,
    language?: string
  ) => Promise<SupplementaryFile[]>

  /**
   * Retrieves a specific supplementary file by its ID.
   *
   * @param {string} id - The unique identifier of the supplementary file
   * @returns {Promise<SupplementaryFile | undefined>} The supplementary file data, or undefined if not found
   */
  getSupplementaryFileById: (id: string) => Promise<SupplementaryFile | undefined>

  /**
   * Creates a new supplementary file record in the database.
   * The actual file should be saved to the filesystem separately.
   *
   * @param {NewSupplementaryFile} file - The supplementary file data to create
   * @returns {Promise<SupplementaryFile | undefined>} The created supplementary file with generated ID and metadata
   */
  createSupplementaryFile: (file: NewSupplementaryFile) => Promise<SupplementaryFile | undefined>

  /**
   * Updates an existing supplementary file with new metadata.
   *
   * @param {string} id - The unique identifier of the supplementary file to update
   * @param {SupplementaryFileUpdate} fileUpdate - The updated data for the supplementary file
   * @returns {Promise<SupplementaryFile | undefined>} The updated supplementary file data
   */
  updateSupplementaryFile: (
    id: string,
    fileUpdate: SupplementaryFileUpdate
  ) => Promise<SupplementaryFile | undefined>

  /**
   * Deletes a supplementary file by its ID.
   * This removes the database record but does not delete the actual file.
   *
   * @param {string} id - The unique identifier of the supplementary file to delete
   * @returns {Promise<boolean>} True if the deletion was successful, false otherwise
   */
  deleteSupplementaryFile: (id: string) => Promise<boolean>
}
