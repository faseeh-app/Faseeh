import { Kysely } from 'kysely'
import { Database, EmbeddedAsset, EmbeddedAssetUpdate, NewEmbeddedAsset } from '@main/db/types'
import path from 'node:path'
import fs from 'node:fs/promises'
import {
  FASEEH_BASE_PATH,
  LIBRARY_DIR_NAME,
  EMBEDDED_ASSETS_DIR_NAME,
  ensureDirExists
} from './paths'
// == EmbeddedAssets ==
export async function getEmbeddedAssetsByLibraryItem(
  db: Kysely<Database>,
  libraryItemId: string
): Promise<EmbeddedAsset[]> {
  return await db
    .selectFrom('embeddedAssets')
    .selectAll()
    .where('libraryItemId', '=', libraryItemId)
    .orderBy('originalSrc')
    .execute()
}

export async function getEmbeddedAssetById(
  db: Kysely<Database>,
  id: string
): Promise<EmbeddedAsset | undefined> {
  // This was partially implemented for path, now full entity
  return await db.selectFrom('embeddedAssets').selectAll().where('id', '=', id).executeTakeFirst()
}

export async function createEmbeddedAsset(
  db: Kysely<Database>,
  asset: NewEmbeddedAsset
): Promise<EmbeddedAsset | undefined> {
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
  await ensureDirExists(itemAssetDir)
  // Here, you might copy a file from a temporary location to:
  // path.join(itemAssetDir, asset.storagePath)
  // For now, we just create the DB record.

  const newId = asset.id || crypto.randomUUID() // Ensure ID exists
  return await db
    .insertInto('embeddedAssets')
    .values({ ...asset, id: newId, createdAt: now })
    .returningAll()
    .executeTakeFirst()
}

export async function updateEmbeddedAsset(
  db: Kysely<Database>,
  id: string,
  assetUpdate: EmbeddedAssetUpdate
): Promise<EmbeddedAsset | undefined> {
  // If storagePath changes, old file might need to be deleted / new one moved.
  // This logic is not included here for brevity.
  return await db
    .updateTable('embeddedAssets')
    .set({ ...assetUpdate })
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirst()
}

export async function deleteEmbeddedAsset(db: Kysely<Database>, id: string): Promise<boolean> {
  const asset = await getEmbeddedAssetById(db, id)
  if (!asset) return false

  const result = await db.deleteFrom('embeddedAssets').where('id', '=', id).executeTakeFirst()
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
