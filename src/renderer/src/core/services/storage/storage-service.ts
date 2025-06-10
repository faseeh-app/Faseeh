import type { IStorage } from '@shared/domain-storage'

const { ipcRenderer } = require('electron')

export const storage: IStorage = {
  // == Path Management ==
  getFaseehFolderPath: () => ipcRenderer.invoke('storage:getFaseehFolderPath'),
  getLibraryItemDirectoryPath: (libraryItemId) =>
    ipcRenderer.invoke('storage:getLibraryItemDirectoryPath', libraryItemId),
  getEmbeddedAssetAbsolutePath: (assetId) =>
    ipcRenderer.invoke('storage:getEmbeddedAssetAbsolutePath', assetId),
  getSupplementaryFileAbsolutePath: (fileId) =>
    ipcRenderer.invoke('storage:getSupplementaryFileAbsolutePath', fileId),
  getPluginDirectoryPath: (pluginId) =>
    ipcRenderer.invoke('storage:getPluginDirectoryPath', pluginId),
  listPluginDirectories: () => ipcRenderer.invoke('storage:listPluginDirectories'),
  getConfigDirectoryPath: () => ipcRenderer.invoke('storage:getConfigDirectoryPath'),

  // == LibraryItems & Document.json ==
  getLibraryItems: (criteria?) => ipcRenderer.invoke('storage:getLibraryItems', criteria),
  getLibraryItemById: (id) => ipcRenderer.invoke('storage:getLibraryItemById', id),
  createLibraryItem: (item, documentContent?) =>
    ipcRenderer.invoke('storage:createLibraryItem', item, documentContent),
  updateLibraryItem: (id, itemUpdate) =>
    ipcRenderer.invoke('storage:updateLibraryItem', id, itemUpdate),
  deleteLibraryItem: (id) => ipcRenderer.invoke('storage:deleteLibraryItem', id),
  getDocumentJson: (libraryItemId) => ipcRenderer.invoke('storage:getDocumentJson', libraryItemId),
  saveDocumentJson: (libraryItemId, content) =>
    ipcRenderer.invoke('storage:saveDocumentJson', libraryItemId, content),

  // == PluginData (Database) ==
  getPluginDataEntries: (pluginId, key?, libraryItemId?) =>
    ipcRenderer.invoke('storage:getPluginDataEntries', pluginId, key, libraryItemId),
  getPluginDataEntryById: (id) => ipcRenderer.invoke('storage:getPluginDataEntryById', id),
  createPluginDataEntry: (data) => ipcRenderer.invoke('storage:createPluginDataEntry', data),
  updatePluginDataEntry: (id, dataUpdate) =>
    ipcRenderer.invoke('storage:updatePluginDataEntry', id, dataUpdate),
  deletePluginDataEntry: (id) => ipcRenderer.invoke('storage:deletePluginDataEntry', id),
  deletePluginDataEntriesByKey: (pluginId, key, libraryItemId?) =>
    ipcRenderer.invoke('storage:deletePluginDataEntriesByKey', pluginId, key, libraryItemId),

  // == Plugin File Data (Filesystem) ==
  readPluginManifest: (pluginId) => ipcRenderer.invoke('storage:readPluginManifest', pluginId),
  readPluginDataFile: (pluginId, relativePath) =>
    ipcRenderer.invoke('storage:readPluginDataFile', pluginId, relativePath),
  writePluginDataFile: (pluginId, relativePath, content) =>
    ipcRenderer.invoke('storage:writePluginDataFile', pluginId, relativePath, content),
  deletePluginDataFile: (pluginId, relativePath) =>
    ipcRenderer.invoke('storage:deletePluginDataFile', pluginId, relativePath),
  listPluginDataFiles: (pluginId, subDirectory?) =>
    ipcRenderer.invoke('storage:listPluginDataFiles', pluginId, subDirectory),

  // == AppSettings (Database - for settings.json like data) ==
  getAppSetting: (key) => ipcRenderer.invoke('storage:getAppSetting', key),
  getAllAppSettings: () => ipcRenderer.invoke('storage:getAllAppSettings'),
  setAppSetting: (setting) => ipcRenderer.invoke('storage:setAppSetting', setting),
  deleteAppSetting: (key) => ipcRenderer.invoke('storage:deleteAppSetting', key),

  // == Specific Config Files (Filesystem) ==
  getEnabledPluginIds: () => ipcRenderer.invoke('storage:getEnabledPluginIds'),
  setEnabledPluginIds: (pluginIds) => ipcRenderer.invoke('storage:setEnabledPluginIds', pluginIds),

  // == ContentGroups ==
  getContentGroups: () => ipcRenderer.invoke('storage:getContentGroups'),
  getContentGroupById: (id) => ipcRenderer.invoke('storage:getContentGroupById', id),
  createContentGroup: (group) => ipcRenderer.invoke('storage:createContentGroup', group),
  updateContentGroup: (id, groupUpdate) =>
    ipcRenderer.invoke('storage:updateContentGroup', id, groupUpdate),
  deleteContentGroup: (id) => ipcRenderer.invoke('storage:deleteContentGroup', id),

  // == Collections ==
  getCollections: () => ipcRenderer.invoke('storage:getCollections'),
  getCollectionById: (id) => ipcRenderer.invoke('storage:getCollectionById', id),
  createCollection: (collection) => ipcRenderer.invoke('storage:createCollection', collection),
  updateCollection: (id, collectionUpdate) =>
    ipcRenderer.invoke('storage:updateCollection', id, collectionUpdate),
  deleteCollection: (id) => ipcRenderer.invoke('storage:deleteCollection', id),

  // == CollectionMembers ==
  getCollectionMembers: (collectionId) =>
    ipcRenderer.invoke('storage:getCollectionMembers', collectionId),
  getCollectionsForMember: (itemId, itemType) =>
    ipcRenderer.invoke('storage:getCollectionsForMember', itemId, itemType),
  addCollectionMember: (member) => ipcRenderer.invoke('storage:addCollectionMember', member),
  updateCollectionMemberOrder: (collectionId, itemId, itemType, newOrder) =>
    ipcRenderer.invoke(
      'storage:updateCollectionMemberOrder',
      collectionId,
      itemId,
      itemType,
      newOrder
    ),
  removeCollectionMember: (collectionId, itemId, itemType) =>
    ipcRenderer.invoke('storage:removeCollectionMember', collectionId, itemId, itemType),

  // == VocabularyRegistry ==
  getVocabularyEntries: (language?, text?) =>
    ipcRenderer.invoke('storage:getVocabularyEntries', language, text),
  getVocabularyEntryById: (id) => ipcRenderer.invoke('storage:getVocabularyEntryById', id),
  findOrCreateVocabularyEntry: (entry) =>
    ipcRenderer.invoke('storage:findOrCreateVocabularyEntry', entry),
  updateVocabularyEntry: (id, entryUpdate) =>
    ipcRenderer.invoke('storage:updateVocabularyEntry', id, entryUpdate),
  deleteVocabularyEntry: (id) => ipcRenderer.invoke('storage:deleteVocabularyEntry', id),

  // == VocabularySources ==
  getVocabularySources: (filters) => ipcRenderer.invoke('storage:getVocabularySources', filters),
  addVocabularySource: (source) => ipcRenderer.invoke('storage:addVocabularySource', source),
  deleteVocabularySources: (criteria) =>
    ipcRenderer.invoke('storage:deleteVocabularySources', criteria),

  // == EmbeddedAssets ==
  getEmbeddedAssetsByLibraryItem: (libraryItemId) =>
    ipcRenderer.invoke('storage:getEmbeddedAssetsByLibraryItem', libraryItemId),
  getEmbeddedAssetById: (id) => ipcRenderer.invoke('storage:getEmbeddedAssetById', id),
  createEmbeddedAsset: (asset) => ipcRenderer.invoke('storage:createEmbeddedAsset', asset),
  updateEmbeddedAsset: (id, assetUpdate) =>
    ipcRenderer.invoke('storage:updateEmbeddedAsset', id, assetUpdate),
  deleteEmbeddedAsset: (id) => ipcRenderer.invoke('storage:deleteEmbeddedAsset', id),

  // == SupplementaryFiles ==
  getSupplementaryFilesByLibraryItem: (libraryItemId, type?, language?) =>
    ipcRenderer.invoke('storage:getSupplementaryFilesByLibraryItem', libraryItemId, type, language),
  getSupplementaryFileById: (id) => ipcRenderer.invoke('storage:getSupplementaryFileById', id),
  createSupplementaryFile: (file) => ipcRenderer.invoke('storage:createSupplementaryFile', file),
  updateSupplementaryFile: (id, fileUpdate) =>
    ipcRenderer.invoke('storage:updateSupplementaryFile', id, fileUpdate),
  deleteSupplementaryFile: (id) => ipcRenderer.invoke('storage:deleteSupplementaryFile', id)
}
