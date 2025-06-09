import { app } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'
import { Kysely } from 'kysely'
import { Database } from '../../db/types'

// --- Path Constants ---
export const USER_DATA_PATH = app.getPath('userData')
export const FASEEH_FOLDER_NAME = 'faseeh'
export const FASEEH_BASE_PATH = path.join(USER_DATA_PATH, FASEEH_FOLDER_NAME)

export const LIBRARY_DIR_NAME = 'library'
export const PLUGINS_DIR_NAME = 'plugins'
export const CONFIG_DIR_NAME = 'config'
export const MODELS_DIR_NAME = 'models'

export const DOCUMENT_JSON_FILE_NAME = 'document.json'
export const EMBEDDED_ASSETS_DIR_NAME = 'assets'
export const SUPPLEMENTARY_FILES_DIR_NAME = 'supplementary'
export const PLUGIN_DATA_SUBDIR_NAME = 'data'
export const PLUGIN_MANIFEST_FILE_NAME = 'manifest.json'

export const ENABLED_PLUGINS_FILE_NAME = 'enabled_plugins.json'
export const APP_SETTINGS_FILE_NAME = 'settings.json'

// --- Helper Functions ---
export async function ensureDirExists(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true })
  } catch (error) {
    console.error(`Failed to create directory ${dirPath}:`, error)
    throw error
  }
}

export async function initializeFaseehDirectory(): Promise<void> {
  await ensureDirExists(FASEEH_BASE_PATH)
  await ensureDirExists(path.join(FASEEH_BASE_PATH, LIBRARY_DIR_NAME))
  await ensureDirExists(path.join(FASEEH_BASE_PATH, PLUGINS_DIR_NAME))
  await ensureDirExists(path.join(FASEEH_BASE_PATH, CONFIG_DIR_NAME))
  await ensureDirExists(path.join(FASEEH_BASE_PATH, MODELS_DIR_NAME))

  const enabledPluginsPath = path.join(FASEEH_BASE_PATH, CONFIG_DIR_NAME, ENABLED_PLUGINS_FILE_NAME)
  try {
    await fs.access(enabledPluginsPath)
  } catch {
    await fs.writeFile(enabledPluginsPath, JSON.stringify([], null, 2))
  }
}

// Path Management specific functions from the old service
export async function getFaseehFolderPath(): Promise<string> {
  return FASEEH_BASE_PATH
}

export async function getLibraryItemDirectoryPath(
  libraryItemId: string
): Promise<string | undefined> {
  if (!libraryItemId) return undefined
  const itemPath = path.join(FASEEH_BASE_PATH, LIBRARY_DIR_NAME, libraryItemId)
  try {
    await fs.access(itemPath)
    return itemPath
  } catch {
    return undefined
  }
}

export async function getSupplementaryFileAbsolutePathFromId(
  db: Kysely<Database>,
  fileId: string
): Promise<string | undefined> {
  const file = await db
    .selectFrom('supplementaryFiles')
    .select(['libraryItemId', 'storagePath'])
    .where('id', '=', fileId)
    .executeTakeFirst()
  if (!file || !file.libraryItemId || !file.storagePath) return undefined
  return path.join(
    FASEEH_BASE_PATH,
    LIBRARY_DIR_NAME,
    file.libraryItemId,
    SUPPLEMENTARY_FILES_DIR_NAME,
    file.storagePath
  )
}

export async function getEmbeddedAssetAbsolutePathFromId(
  db: Kysely<Database>,
  assetId: string
): Promise<string | undefined> {
  const asset = await db
    .selectFrom('embeddedAssets')
    .select(['libraryItemId', 'storagePath'])
    .where('id', '=', assetId)
    .executeTakeFirst()
  if (!asset || !asset.libraryItemId || !asset.storagePath) return undefined
  return path.join(
    FASEEH_BASE_PATH,
    LIBRARY_DIR_NAME,
    asset.libraryItemId,
    EMBEDDED_ASSETS_DIR_NAME,
    asset.storagePath
  )
}

export async function getPluginDirectoryPath(pluginId: string): Promise<string | undefined> {
  if (!pluginId) return undefined
  return path.join(FASEEH_BASE_PATH, PLUGINS_DIR_NAME, pluginId)
}

export async function listPluginDirectories(): Promise<string[]> {
  try {
    const pluginsPath = path.join(FASEEH_BASE_PATH, PLUGINS_DIR_NAME)
    const entries = await fs.readdir(pluginsPath, { withFileTypes: true })
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(pluginsPath, entry.name))
  } catch (error) {
    console.error('Failed to list plugin directories:', error)
    return []
  }
}

export async function getConfigDirectoryPath(): Promise<string | undefined> {
  return path.join(FASEEH_BASE_PATH, CONFIG_DIR_NAME)
}
