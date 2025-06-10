import { Kysely, sql } from 'kysely'
import { Database } from '@root/src/shared/types' // Assuming types.ts uses camelCase

export async function up(db: Kysely<Database>): Promise<void> {
  // Enable foreign keys - crucial for SQLite
  // await sql`PRAGMA foreign_keys = ON;`.execute(db) // Consider enabling this in database.ts

  // Create contentGroups table
  await db.schema
    .createTable('contentGroups')
    .addColumn('id', 'text', (col) => col.primaryKey().notNull())
    .addColumn('type', 'text', (col) => col.notNull())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('dynamicMetadata', 'text', (col) => col.notNull().defaultTo('{}'))
    .addColumn('createdAt', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updatedAt', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute()

  await db.schema.createIndex('idxContentGroupsType').on('contentGroups').column('type').execute()
  await db.schema.createIndex('idxContentGroupsName').on('contentGroups').column('name').execute()
  await sql`
    CREATE TRIGGER trgContentGroupsUpdatedAt
    AFTER UPDATE ON contentGroups
    FOR EACH ROW
    BEGIN
      UPDATE contentGroups SET updatedAt = CURRENT_TIMESTAMP WHERE id = old.id;
    END;
  `.execute(db)

  // Create collections table
  await db.schema
    .createTable('collections')
    .addColumn('id', 'text', (col) => col.primaryKey().notNull())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('dynamicMetadata', 'text', (col) => col.notNull().defaultTo('{}'))
    .addColumn('createdAt', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updatedAt', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute()

  await db.schema.createIndex('idxCollectionsName').on('collections').column('name').execute()
  await sql`
    CREATE TRIGGER trgCollectionsUpdatedAt
    AFTER UPDATE ON collections
    FOR EACH ROW
    BEGIN
      UPDATE collections SET updatedAt = CURRENT_TIMESTAMP WHERE id = old.id;
    END;
  `.execute(db)

  // Create vocabularyRegistry table
  await db.schema
    .createTable('vocabularyRegistry')
    .addColumn('id', 'text', (col) => col.primaryKey().notNull())
    .addColumn('text', 'text', (col) => col.notNull())
    .addColumn('language', 'text', (col) => col.notNull())
    .addColumn('createdAt', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    // Add updatedAt and its trigger if you need to track updates for vocabularyRegistry
    .addUniqueConstraint('uqVocabularyRegistryTextLanguage', ['text', 'language'])
    .execute()

  await db.schema
    .createIndex('idxVocabularyRegistryTextLanguage')
    .on('vocabularyRegistry')
    .columns(['text', 'language'])
    .execute()
  await db.schema
    .createIndex('idxVocabularyRegistryLanguage')
    .on('vocabularyRegistry')
    .column('language')
    .execute()

  // Create libraryItems table
  await db.schema
    .createTable('libraryItems')
    .addColumn('id', 'text', (col) => col.primaryKey().notNull())
    .addColumn('type', 'text', (col) => col.notNull())
    .addColumn('name', 'text')
    .addColumn('language', 'text')
    .addColumn('sourceUri', 'text')
    .addColumn('storagePath', 'text')
    .addColumn('contentDocumentPath', 'text')
    .addColumn('contentGroupId', 'text', (col) => col.references('contentGroups.id'))
    .addColumn('groupOrder', 'integer')
    .addColumn('dynamicMetadata', 'text', (col) => col.notNull().defaultTo('{}'))
    .addColumn('createdAt', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updatedAt', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute()

  await db.schema.createIndex('idxLibraryItemsType').on('libraryItems').column('type').execute()
  await db.schema
    .createIndex('idxLibraryItemsLanguage')
    .on('libraryItems')
    .column('language')
    .execute()
  await db.schema
    .createIndex('idxLibraryItemsContentGroupId')
    .on('libraryItems')
    .column('contentGroupId')
    .execute()
  await db.schema
    .createIndex('idxLibraryItemsCreatedAt')
    .on('libraryItems')
    .column('createdAt')
    .execute()
  await sql`
    CREATE TRIGGER trgLibraryItemsUpdatedAt
    AFTER UPDATE ON libraryItems
    FOR EACH ROW
    BEGIN
      UPDATE libraryItems SET updatedAt = CURRENT_TIMESTAMP WHERE id = old.id;
    END;
  `.execute(db)

  // Create pluginData table
  await db.schema
    .createTable('pluginData')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('pluginId', 'text', (col) => col.notNull())
    .addColumn('key', 'text', (col) => col.notNull())
    .addColumn('jsonData', 'text', (col) => col.notNull().defaultTo('{}'))
    .addColumn('libraryItemId', 'text', (col) => col.references('libraryItems.id'))
    .addColumn('createdAt', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updatedAt', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    // Add trigger for updatedAt if needed
    .execute()

  // Create appSetting table
  await db.schema
    .createTable('appSettings')
    .addColumn('key', 'text', (col) => col.primaryKey().notNull())
    .addColumn('value', 'text', (col) => col.notNull().defaultTo('{}'))
    .addColumn('createdAt', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updatedAt', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    // Add trigger for updatedAt if needed
    .execute()

  // Create collectionMembers table
  await db.schema
    .createTable('collectionMembers')
    .addColumn('collectionId', 'text', (col) => col.notNull().references('collections.id'))
    .addColumn('itemId', 'text', (col) => col.notNull()) // Refers to libraryItems.id or contentGroups.id
    .addColumn('itemType', 'text', (col) => col.notNull()) // 'LibraryItem' or 'ContentGroup'
    .addColumn('itemOrder', 'integer', (col) => col.notNull())
    // Add createdAt and updatedAt if needed, and their triggers
    .addPrimaryKeyConstraint('pkCollectionMembers', ['collectionId', 'itemId'])
    .execute()

  await db.schema
    .createIndex('idxCollectionMembersCollectionId')
    .on('collectionMembers')
    .column('collectionId')
    .execute()
  await db.schema
    .createIndex('idxCollectionMembersItemId')
    .on('collectionMembers')
    .column('itemId')
    .execute()

  // Create vocabularySources table
  await db.schema
    .createTable('vocabularySources')
    .addColumn('vocabularyId', 'text', (col) => col.notNull().references('vocabularyRegistry.id'))
    .addColumn('libraryItemId', 'text', (col) => col.notNull().references('libraryItems.id'))
    .addColumn('contextSentence', 'text')
    .addColumn('startOffset', 'integer')
    .addColumn('endOffset', 'integer')
    .addColumn('timestampMs', 'integer')
    // Add createdAt and updatedAt if needed, and their triggers
    // No explicit PK, but a composite one could be (vocabularyId, libraryItemId, startOffset, endOffset) if needed
    .execute()

  await db.schema
    .createIndex('idxVocabularySourcesVocabularyId')
    .on('vocabularySources')
    .column('vocabularyId')
    .execute()
  await db.schema
    .createIndex('idxVocabularySourcesLibraryItemId')
    .on('vocabularySources')
    .column('libraryItemId')
    .execute()
  await db.schema
    .createIndex('idxVocabularySourcesLibraryItemIdTimestamp')
    .on('vocabularySources')
    .columns(['libraryItemId', 'timestampMs'])
    .execute()

  // Create embeddedAssets table
  await db.schema
    .createTable('embeddedAssets')
    .addColumn('id', 'text', (col) => col.primaryKey().notNull())
    .addColumn('libraryItemId', 'text', (col) => col.notNull().references('libraryItems.id'))
    .addColumn('storagePath', 'text', (col) => col.notNull().unique())
    .addColumn('format', 'text')
    .addColumn('originalSrc', 'text')
    .addColumn('width', 'integer')
    .addColumn('height', 'integer')
    .addColumn('sizeBytes', 'integer')
    .addColumn('checksum', 'text')
    .addColumn('createdAt', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    // Add updatedAt and its trigger if needed
    .execute()

  await db.schema
    .createIndex('idxEmbeddedAssetsLibraryItemId')
    .on('embeddedAssets')
    .column('libraryItemId')
    .execute()

  // Create supplementaryFiles table
  await db.schema
    .createTable('supplementaryFiles')
    .addColumn('id', 'text', (col) => col.primaryKey().notNull())
    .addColumn('libraryItemId', 'text', (col) => col.notNull().references('libraryItems.id'))
    .addColumn('type', 'text', (col) => col.notNull())
    .addColumn('storagePath', 'text', (col) => col.notNull().unique())
    .addColumn('format', 'text')
    .addColumn('language', 'text')
    .addColumn('filename', 'text')
    .addColumn('sizeBytes', 'integer')
    .addColumn('checksum', 'text')
    .addColumn('createdAt', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    // Add updatedAt and its trigger if needed
    .execute()

  await db.schema
    .createIndex('idxSupplementaryFilesLibraryItemId')
    .on('supplementaryFiles')
    .column('libraryItemId')
    .execute()
  await db.schema
    .createIndex('idxSupplementaryFilesType')
    .on('supplementaryFiles')
    .column('type')
    .execute()
  await db.schema
    .createIndex('idxSupplementaryFilesLanguage')
    .on('supplementaryFiles')
    .column('language')
    .execute()
}

export async function down(db: Kysely<Database>): Promise<void> {
  // Drop tables in reverse order of creation, considering dependencies
  await db.schema.dropTable('supplementaryFiles').ifExists().execute()
  await db.schema.dropTable('embeddedAssets').ifExists().execute()
  await db.schema.dropTable('vocabularySources').ifExists().execute()
  await db.schema.dropTable('collectionMembers').ifExists().execute()
  await db.schema.dropTable('appSetting').ifExists().execute()
  await db.schema.dropTable('pluginData').ifExists().execute()
  await db.schema.dropTable('libraryItems').ifExists().execute()
  await db.schema.dropTable('vocabularyRegistry').ifExists().execute()
  await db.schema.dropTable('collections').ifExists().execute()
  await db.schema.dropTable('contentGroups').ifExists().execute()

  // Triggers are typically dropped when the table is dropped in SQLite.
  // If you had named triggers and wanted to be explicit or for other DBs:
  // await sql`DROP TRIGGER IF EXISTS trgLibraryItemsUpdatedAt;`.execute(db)
  // await sql`DROP TRIGGER IF EXISTS trgContentGroupsUpdatedAt;`.execute(db)
  // await sql`DROP TRIGGER IF EXISTS trgCollectionsUpdatedAt;`.execute(db)
}
