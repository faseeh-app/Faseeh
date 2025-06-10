import type { Kysely } from 'kysely'
import type { Database, LibraryItem, NewLibraryItem, LibraryItemUpdate } from '@root/src/shared/db'
import type { ContentDocument } from '@shared/types'
import fs from 'node:fs/promises'
import path from 'node:path'
import {
  FASEEH_BASE_PATH,
  LIBRARY_DIR_NAME,
  DOCUMENT_JSON_FILE_NAME,
  EMBEDDED_ASSETS_DIR_NAME,
  SUPPLEMENTARY_FILES_DIR_NAME,
  ensureDirExists
} from './paths'

export async function getLibraryItems(
  db: Kysely<Database>,
  criteria?: Partial<LibraryItem>
): Promise<LibraryItem[]> {
  let query = db.selectFrom('libraryItems').selectAll()
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

export async function getLibraryItemById(
  db: Kysely<Database>,
  id: string
): Promise<LibraryItem | undefined> {
  return await db.selectFrom('libraryItems').selectAll().where('id', '=', id).executeTakeFirst()
}

export async function createLibraryItem(
  db: Kysely<Database>,
  item: NewLibraryItem,
  documentContent?: ContentDocument
): Promise<LibraryItem | undefined> {
  // Ensure library item directory exists
  const itemDirPath = path.join(FASEEH_BASE_PATH, LIBRARY_DIR_NAME, item.id)
  await ensureDirExists(itemDirPath)
  await ensureDirExists(path.join(itemDirPath, EMBEDDED_ASSETS_DIR_NAME))
  await ensureDirExists(path.join(itemDirPath, SUPPLEMENTARY_FILES_DIR_NAME))

  const newItem = await db
    .insertInto('libraryItems')
    .values({ ...item, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    .returningAll()
    .executeTakeFirst()

  if (newItem && documentContent) {
    await saveDocumentJson(newItem.id, documentContent)
  }
  return newItem
}

export async function updateLibraryItem(
  db: Kysely<Database>,
  id: string,
  itemUpdate: LibraryItemUpdate
): Promise<LibraryItem | undefined> {
  return await db
    .updateTable('libraryItems')
    .set({ ...itemUpdate, updatedAt: new Date().toISOString() })
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirst()
}

export async function deleteLibraryItem(db: Kysely<Database>, id: string): Promise<boolean> {
  const result = await db.deleteFrom('libraryItems').where('id', '=', id).executeTakeFirst()
  if (result.numDeletedRows > 0) {
    const itemDirPath = path.join(FASEEH_BASE_PATH, LIBRARY_DIR_NAME, id)
    try {
      await fs.rm(itemDirPath, { recursive: true, force: true })
    } catch (error) {
      console.error(`Failed to delete directory for library item ${id}:`, error)
      // Decide if this should make the overall operation fail
    }
    return true
  }
  return false
}

export async function getDocumentJson(
  _db: Kysely<Database>, // db might not be needed if path is solely derived
  libraryItemId: string
): Promise<ContentDocument | undefined> {
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

export async function saveDocumentJson(
  libraryItemId: string,
  content: ContentDocument
): Promise<boolean> {
  const itemDirPath = path.join(FASEEH_BASE_PATH, LIBRARY_DIR_NAME, libraryItemId)
  await ensureDirExists(itemDirPath) // Ensure parent dir exists
  const docPath = path.join(itemDirPath, DOCUMENT_JSON_FILE_NAME)
  try {
    await fs.writeFile(docPath, JSON.stringify(content, null, 2))
    return true
  } catch (error) {
    console.error(`Failed to save document.json for ${libraryItemId}:`, error)
    return false
  }
}
