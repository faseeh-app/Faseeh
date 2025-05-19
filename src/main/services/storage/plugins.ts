import { Kysely } from 'kysely'
import { PluginData, NewPluginData, PluginDataUpdate, Database } from '../../db/types'
import path from 'node:path'
import fs from 'node:fs/promises'
import {
  FASEEH_BASE_PATH,
  PLUGINS_DIR_NAME,
  PLUGIN_DATA_SUBDIR_NAME,
  ensureDirExists
} from './paths'

// == PluginData (Database) ==
export async function getPluginDataEntries(
  db: Kysely<Database>,
  pluginId: string,
  key?: string,
  libraryItemId?: string | null
): Promise<PluginData[]> {
  let query = db.selectFrom('pluginData').selectAll().where('pluginId', '=', pluginId)

  if (key !== undefined) {
    query = query.where('key', '=', key)
  }
  if (libraryItemId !== undefined) {
    // Handles both specific libraryItemId and null for global plugin data
    query = query.where('libraryItemId', libraryItemId === null ? 'is' : '=', libraryItemId)
  }
  return await query.orderBy('id').execute()
}

export async function getPluginDataEntryById(
  db: Kysely<Database>,
  id: number
): Promise<PluginData | undefined> {
  return await db.selectFrom('pluginData').selectAll().where('id', '=', id).executeTakeFirst()
}

export async function createPluginDataEntry(
  db: Kysely<Database>,
  data: NewPluginData
): Promise<PluginData | undefined> {
  return await db
    .insertInto('pluginData')
    .values({ ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    .returningAll()
    .executeTakeFirst()
}

export async function updatePluginDataEntry(
  db: Kysely<Database>,
  id: number,
  dataUpdate: PluginDataUpdate
): Promise<PluginData | undefined> {
  return await db
    .updateTable('pluginData')
    .set({ ...dataUpdate, updatedAt: new Date().toISOString() })
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirst()
}

export async function deletePluginDataEntry(db: Kysely<Database>, id: number): Promise<boolean> {
  const result = await db.deleteFrom('pluginData').where('id', '=', id).executeTakeFirst()
  return result.numDeletedRows > 0
}

export async function deletePluginDataEntriesByKey(
  db: Kysely<Database>,
  pluginId: string,
  key: string,
  libraryItemId?: string | null
): Promise<number> {
  let query = db.deleteFrom('pluginData').where('pluginId', '=', pluginId).where('key', '=', key)

  if (libraryItemId !== undefined) {
    query = query.where('libraryItemId', libraryItemId === null ? 'is' : '=', libraryItemId)
  }
  const result = await query.executeTakeFirst()
  return Number(result.numDeletedRows) || 0
}

// == Plugin File Data (Filesystem) ==
export async function readPluginDataFile(
  pluginId: string,
  relativePath: string
): Promise<string | undefined> {
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

export async function writePluginDataFile(
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
    await ensureDirExists(path.dirname(filePath)) // Ensure parent directory of the file exists
    await fs.writeFile(filePath, content, 'utf-8')
    return true
  } catch (error) {
    console.error(`Failed to write plugin data file ${filePath}:`, error)
    return false
  }
}

export async function deletePluginDataFile(
  pluginId: string,
  relativePath: string
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

export async function listPluginDataFiles(
  pluginId: string,
  subDirectory?: string
): Promise<string[]> {
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
    // Return names, could also return more detailed info (isFile, isDirectory)
    return entries.map((entry) => entry.name)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [] // Directory doesn't exist
    }
    console.error(`Failed to list plugin data files in ${targetDir}:`, error)
    throw error
  }
}
