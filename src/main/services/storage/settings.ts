import path from 'node:path'
import { AppSettings, NewAppSettings, AppSettingsUpdate, Database } from '@shared/db'
import { FASEEH_BASE_PATH, CONFIG_DIR_NAME, ENABLED_PLUGINS_FILE_NAME } from './paths'
import { Kysely } from 'kysely'
import fs from 'node:fs/promises'

// == AppSettings (Database - for settings.json like data) ==
export async function getAppSetting(
  db: Kysely<Database>,
  key: string
): Promise<AppSettings | undefined> {
  return await db.selectFrom('appSettings').selectAll().where('key', '=', key).executeTakeFirst()
}

export async function getAllAppSettings(db: Kysely<Database>): Promise<AppSettings[]> {
  return await db.selectFrom('appSettings').selectAll().orderBy('key').execute()
}

export async function setAppSetting(
  db: Kysely<Database>,
  setting: { key: string; value: string } & Omit<
    NewAppSettings | AppSettingsUpdate,
    'key' | 'value'
  >
): Promise<AppSettings | undefined> {
  const { key, value } = setting
  const now = new Date().toISOString()

  return await db
    .insertInto('appSettings')
    .values({ key, value, createdAt: now, updatedAt: now })
    .onConflict((oc) => oc.column('key').doUpdateSet({ value, updatedAt: now }))
    .returningAll()
    .executeTakeFirstOrThrow()
}

export async function deleteAppSetting(db: Kysely<Database>, key: string): Promise<boolean> {
  const result = await db.deleteFrom('appSettings').where('key', '=', key).executeTakeFirst()
  return result.numDeletedRows > 0
}

// == Specific Config Files (Filesystem) ==
export async function getEnabledPluginIds(): Promise<string[]> {
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

export async function setEnabledPluginIds(pluginIds: string[]): Promise<boolean> {
  const filePath = path.join(FASEEH_BASE_PATH, CONFIG_DIR_NAME, ENABLED_PLUGINS_FILE_NAME)
  try {
    await fs.writeFile(filePath, JSON.stringify(pluginIds, null, 2), 'utf-8')
    return true
  } catch (error) {
    console.error(`Failed to write ${ENABLED_PLUGINS_FILE_NAME}:`, error)
    return false
  }
}
