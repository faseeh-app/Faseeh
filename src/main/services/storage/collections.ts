import { Kysely } from 'kysely'
import {
  Database,
  Collection,
  NewCollection,
  CollectionUpdate,
  CollectionMember,
  NewCollectionMember
} from '@main/db/types'

// == Collections ==
export async function getCollections(db: Kysely<Database>): Promise<Collection[]> {
  return await db.selectFrom('collections').selectAll().orderBy('name').execute()
}

export async function getCollectionById(
  db: Kysely<Database>,
  id: string
): Promise<Collection | undefined> {
  return await db.selectFrom('collections').selectAll().where('id', '=', id).executeTakeFirst()
}

export async function createCollection(
  db: Kysely<Database>,
  collection: NewCollection
): Promise<Collection | undefined> {
  const now = new Date().toISOString()
  return await db
    .insertInto('collections')
    .values({ ...collection, createdAt: now, updatedAt: now })
    .returningAll()
    .executeTakeFirst()
}

export async function updateCollection(
  db: Kysely<Database>,
  id: string,
  collectionUpdate: CollectionUpdate
): Promise<Collection | undefined> {
  const now = new Date().toISOString()
  return await db
    .updateTable('collections')
    .set({ ...collectionUpdate, updatedAt: now })
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirst()
}

export async function deleteCollection(db: Kysely<Database>, id: string): Promise<boolean> {
  // Also delete associated collection members
  await db.deleteFrom('collectionMembers').where('collectionId', '=', id).execute()
  const result = await db.deleteFrom('collections').where('id', '=', id).executeTakeFirst()
  return result.numDeletedRows > 0
}

// == CollectionMembers ==
export async function getCollectionMembers(
  db: Kysely<Database>,
  collectionId: string
): Promise<CollectionMember[]> {
  return await db
    .selectFrom('collectionMembers')
    .selectAll()
    .where('collectionId', '=', collectionId)
    .orderBy('itemOrder', 'asc') // Assuming 'order' is the column name for ordering
    .execute()
}

export async function getCollectionsForMember(
  db: Kysely<Database>,
  itemId: string,
  itemType: string
): Promise<CollectionMember[]> {
  return await db
    .selectFrom('collectionMembers')
    .selectAll()
    .where('itemId', '=', itemId)
    .where('itemType', '=', itemType)
    .execute()
}

export async function addCollectionMember(
  db: Kysely<Database>,
  member: NewCollectionMember
): Promise<CollectionMember | undefined> {
  // If 'order' is not provided, set it to a high number or count of existing items + 1
  let itemOrder = member.itemOrder
  if (itemOrder === undefined || itemOrder === null) {
    const maxOrderResult = await db
      .selectFrom('collectionMembers')
      .select(db.fn.max('itemOrder').as('maxOrder'))
      .where('collectionId', '=', member.collectionId)
      .executeTakeFirst()
    itemOrder = (maxOrderResult?.maxOrder || 0) + 1
  }

  return await db
    .insertInto('collectionMembers')
    .values({ ...member, itemOrder })
    .returningAll()
    .executeTakeFirst()
}

export async function updateCollectionMemberOrder(
  db: Kysely<Database>,
  collectionId: string,
  itemId: string,
  itemType: string,
  newOrder: number
): Promise<boolean> {
  const result = await db
    .updateTable('collectionMembers')
    .set({ itemOrder: newOrder })
    .where('collectionId', '=', collectionId)
    .where('itemId', '=', itemId)
    .where('itemType', '=', itemType)
    .executeTakeFirst()
  return result.numUpdatedRows > 0
}

export async function removeCollectionMember(
  db: Kysely<Database>,
  collectionId: string,
  itemId: string,
  itemType: string
): Promise<boolean> {
  const result = await db
    .deleteFrom('collectionMembers')
    .where('collectionId', '=', collectionId)
    .where('itemId', '=', itemId)
    .where('itemType', '=', itemType)
    .executeTakeFirst()
  return result.numDeletedRows > 0
}
