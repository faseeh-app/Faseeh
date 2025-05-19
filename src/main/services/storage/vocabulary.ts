import { Kysely } from 'kysely'
import {
  Database,
  VocabularyRegistry,
  NewVocabularyRegistry,
  VocabularyRegistryUpdate,
  VocabularySource,
  NewVocabularySource
} from '@main/db/types'

// == VocabularyRegistry ==
export async function getVocabularyEntries(
  db: Kysely<Database>,
  language?: string,
  text?: string
): Promise<VocabularyRegistry[]> {
  let query = db.selectFrom('vocabularyRegistry').selectAll()
  if (language) {
    query = query.where('language', '=', language)
  }
  if (text) {
    // Use 'like' for partial matches or '=' for exact, depending on needs
    query = query.where('text', 'like', `%${text}%`)
  }
  return await query.orderBy('text').execute()
}

export async function getVocabularyEntryById(
  db: Kysely<Database>,
  id: string
): Promise<VocabularyRegistry | undefined> {
  return await db
    .selectFrom('vocabularyRegistry')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst()
}

export async function findOrCreateVocabularyEntry(
  db: Kysely<Database>,
  entry: Pick<NewVocabularyRegistry, 'text' | 'language'>
): Promise<VocabularyRegistry | undefined> {
  const now = new Date().toISOString()
  // Attempt to find first
  const existing = await db
    .selectFrom('vocabularyRegistry')
    .selectAll()
    .where('text', '=', entry.text)
    .where('language', '=', entry.language)
    .executeTakeFirst()

  if (existing) {
    return existing
  }
  // Create if not found
  // Generate ID if your DB doesn't do it automatically or if you use UUIDs
  const newId = crypto.randomUUID() // Assuming UUIDs for IDs
  return await db
    .insertInto('vocabularyRegistry')
    .values({ ...entry, id: newId, createdAt: now })
    .returningAll()
    .executeTakeFirst()
}

export async function updateVocabularyEntry(
  db: Kysely<Database>,
  id: string,
  entryUpdate: VocabularyRegistryUpdate
): Promise<VocabularyRegistry | undefined> {
  return await db
    .updateTable('vocabularyRegistry')
    .set({ ...entryUpdate })
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirst()
}

export async function deleteVocabularyEntry(db: Kysely<Database>, id: string): Promise<boolean> {
  // Also delete associated vocabulary sources
  await db.deleteFrom('vocabularySources').where('vocabularyId', '=', id).execute()
  const result = await db.deleteFrom('vocabularyRegistry').where('id', '=', id).executeTakeFirst()
  return result.numDeletedRows > 0
}

// == VocabularySources ==
export async function getVocabularySources(
  db: Kysely<Database>,
  filters: {
    vocabularyId?: string
    libraryItemId?: string
  }
): Promise<VocabularySource[]> {
  let query = db.selectFrom('vocabularySources').selectAll()
  if (filters.vocabularyId) {
    query = query.where('vocabularyId', '=', filters.vocabularyId)
  }
  if (filters.libraryItemId) {
    query = query.where('libraryItemId', '=', filters.libraryItemId)
  }
  return await query.execute()
}

export async function addVocabularySource(
  db: Kysely<Database>,
  source: NewVocabularySource
): Promise<VocabularySource | undefined> {
  // Kysely doesn't directly support returning from composite primary key inserts without specific DB features.
  // We'll insert and then select, or assume the insert was successful if no error.
  // For simplicity, we'll just insert. If you need the inserted row, you might need to query it back.
  // Or, if your DB supports it, use a CTE with RETURNING.
  await db
    .insertInto('vocabularySources')
    .values({ ...source })
    .executeTakeFirstOrThrow() // Throws if insert fails

  // To return the inserted row (less efficient but works across DBs):
  return await db
    .selectFrom('vocabularySources')
    .selectAll()
    .where('vocabularyId', '=', source.vocabularyId)
    .where('libraryItemId', '=', source.libraryItemId)
    .where('contextSentence', '=', source.contextSentence ?? null) // Assuming context helps make it unique enough for this re-query
    .executeTakeFirst()
}

export async function deleteVocabularySources(
  db: Kysely<Database>,
  criteria: Partial<Pick<VocabularySource, 'vocabularyId' | 'libraryItemId'>>
): Promise<number> {
  let query = db.deleteFrom('vocabularySources')
  if (criteria.vocabularyId) {
    query = query.where('vocabularyId', '=', criteria.vocabularyId)
  }
  if (criteria.libraryItemId) {
    query = query.where('libraryItemId', '=', criteria.libraryItemId)
  }
  const result = await query.executeTakeFirst()
  return Number(result.numDeletedRows) || 0
}
