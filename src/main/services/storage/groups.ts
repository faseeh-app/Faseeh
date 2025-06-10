import { Kysely } from 'kysely'
import { ContentGroup, NewContentGroup, ContentGroupUpdate, Database } from '@shared/db'

// == ContentGroups ==
export async function getContentGroups(db: Kysely<Database>): Promise<ContentGroup[]> {
  return await db.selectFrom('contentGroups').selectAll().orderBy('name').execute()
}

export async function getContentGroupById(
  db: Kysely<Database>,
  id: string
): Promise<ContentGroup | undefined> {
  return await db.selectFrom('contentGroups').selectAll().where('id', '=', id).executeTakeFirst()
}

export async function createContentGroup(
  db: Kysely<Database>,
  group: NewContentGroup
): Promise<ContentGroup | undefined> {
  const now = new Date().toISOString()
  return await db
    .insertInto('contentGroups')
    .values({ ...group, createdAt: now, updatedAt: now })
    .returningAll()
    .executeTakeFirst()
}

export async function updateContentGroup(
  db: Kysely<Database>,
  id: string,
  groupUpdate: ContentGroupUpdate
): Promise<ContentGroup | undefined> {
  const now = new Date().toISOString()
  return await db
    .updateTable('contentGroups')
    .set({ ...groupUpdate, updatedAt: now })
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirst()
}

export async function deleteContentGroup(db: Kysely<Database>, id: string): Promise<boolean> {
  const result = await db.deleteFrom('contentGroups').where('id', '=', id).executeTakeFirst()
  return result.numDeletedRows > 0
}
