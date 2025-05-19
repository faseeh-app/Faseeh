import { app } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'

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

export const ENABLED_PLUGINS_FILE_NAME = 'enabled_plugins.json'

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
// ... (getEmbeddedAssetAbsolutePath, getSupplementaryFileAbsolutePath etc. might need db access,
// so they might fit better in their respective modules like assets.ts or supplementary.ts,
// or be refactored to take db as an argument if they stay in paths.ts for pure path logic)
// For now, let's assume methods needing DB go to their feature modules.

export async function getPluginDirectoryPath(pluginId: string): Promise<string | undefined> {
  if (!pluginId) return undefined
  return path.join(FASEEH_BASE_PATH, PLUGINS_DIR_NAME, pluginId)
}

export async function getConfigDirectoryPath(): Promise<string | undefined> {
  return path.join(FASEEH_BASE_PATH, CONFIG_DIR_NAME)
}
