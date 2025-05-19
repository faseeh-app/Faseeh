import {
  Database,
  NewSupplementaryFile,
  SupplementaryFile,
  SupplementaryFileUpdate
} from '@main/db/types'
import { Kysely } from 'kysely'
import path from 'path'
import {
  FASEEH_BASE_PATH,
  LIBRARY_DIR_NAME,
  SUPPLEMENTARY_FILES_DIR_NAME,
  ensureDirExists
} from './paths'
import fs from 'node:fs/promises'

// == SupplementaryFiles ==
export async function getSupplementaryFilesByLibraryItem(
  db: Kysely<Database>,
  libraryItemId: string,
  type?: string,
  language?: string
): Promise<SupplementaryFile[]> {
  let query = db
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

export async function getSupplementaryFileById(
  db: Kysely<Database>,
  id: string
): Promise<SupplementaryFile | undefined> {
  return await db
    .selectFrom('supplementaryFiles')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst()
}

export async function createSupplementaryFile(
  db: Kysely<Database>,
  file: NewSupplementaryFile
): Promise<SupplementaryFile | undefined> {
  const now = new Date().toISOString()
  // Similar to EmbeddedAssets, file handling logic (copying from temp) is omitted.
  // `storagePath` should be just the filename.
  const itemSuppDir = path.join(
    FASEEH_BASE_PATH,
    LIBRARY_DIR_NAME,
    file.libraryItemId,
    SUPPLEMENTARY_FILES_DIR_NAME
  )
  await ensureDirExists(itemSuppDir)

  const newId = file.id || crypto.randomUUID() // Ensure ID exists
  return await db
    .insertInto('supplementaryFiles')
    .values({ ...file, id: newId, createdAt: now })
    .returningAll()
    .executeTakeFirst()
}

export async function updateSupplementaryFile(
  db: Kysely<Database>,
  id: string,
  fileUpdate: SupplementaryFileUpdate
): Promise<SupplementaryFile | undefined> {
  return await db
    .updateTable('supplementaryFiles')
    .set({ ...fileUpdate })
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirst()
}

export async function deleteSupplementaryFile(db: Kysely<Database>, id: string): Promise<boolean> {
  const file = await getSupplementaryFileById(db, id)
  if (!file) return false

  const result = await db.deleteFrom('supplementaryFiles').where('id', '=', id).executeTakeFirst()

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


