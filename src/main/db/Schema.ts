import { Kysely, sql } from 'kysely'
import { Database } from './types'

export async function initSchema(db: Kysely<Database>): Promise<void> {
  // Enable foreign keys - crucial for SQLite
  // await sql`PRAGMA foreign_keys = ON;`.execute(db)

  // Create content_groups table
  await db.schema
    .createTable('content_groups')
    .addColumn('id', 'text', (col) => col.primaryKey().notNull())
    .addColumn('type', 'text', (col) => col.notNull())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('dynamic_metadata', 'text', (col) => col.notNull().defaultTo('{}'))
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute()

  await db.schema
    .createIndex('idx_content_groups_type')
    .on('content_groups')
    .column('type')
    .execute()
  await db.schema
    .createIndex('idx_content_groups_name')
    .on('content_groups')
    .column('name')
    .execute()
  await sql`
    CREATE TRIGGER trg_content_groups_updated_at
    AFTER UPDATE ON content_groups
    FOR EACH ROW
    BEGIN
      UPDATE content_groups SET updated_at = CURRENT_TIMESTAMP WHERE id = old.id;
    END;
  `.execute(db)

  // Create collections table
  await db.schema
    .createTable('collections')
    .addColumn('id', 'text', (col) => col.primaryKey().notNull())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('dynamic_metadata', 'text', (col) => col.notNull().defaultTo('{}'))
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute()

  await db.schema.createIndex('idx_collections_name').on('collections').column('name').execute()
  await sql`
    CREATE TRIGGER trg_collections_updated_at
    AFTER UPDATE ON collections
    FOR EACH ROW
    BEGIN
      UPDATE collections SET updated_at = CURRENT_TIMESTAMP WHERE id = old.id;
    END;
  `.execute(db)

  // Create vocabulary_registry table
  await db.schema
    .createTable('vocabulary_registry')
    .addColumn('id', 'text', (col) => col.primaryKey().notNull())
    .addColumn('text', 'text', (col) => col.notNull())
    .addColumn('language', 'text', (col) => col.notNull())
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addUniqueConstraint('vocabulary_registry_text_language_unique', ['text', 'language'])
    .execute()

  await db.schema
    .createIndex('idx_vocabulary_registry_text_language')
    .on('vocabulary_registry')
    .columns(['text', 'language'])
    .execute()
  await db.schema
    .createIndex('idx_vocabulary_registry_language')
    .on('vocabulary_registry')
    .column('language')
    .execute()

  // Create library_items table
  await db.schema
    .createTable('library_items')
    .addColumn('id', 'text', (col) => col.primaryKey().notNull())
    .addColumn('type', 'text', (col) => col.notNull())
    .addColumn('name', 'text')
    .addColumn('language', 'text')
    .addColumn('source_uri', 'text')
    .addColumn('storage_path', 'text')
    .addColumn('content_document_path', 'text')
    .addColumn('content_group_id', 'text', (col) => col.references('content_groups.id'))
    .addColumn('group_order', 'integer')
    .addColumn('dynamic_metadata', 'text', (col) => col.notNull().defaultTo('{}'))
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute()

  await db.schema.createIndex('idx_library_items_type').on('library_items').column('type').execute()
  await db.schema
    .createIndex('idx_library_items_language')
    .on('library_items')
    .column('language')
    .execute()
  await db.schema
    .createIndex('idx_library_items_content_group_id')
    .on('library_items')
    .column('content_group_id')
    .execute()
  await db.schema
    .createIndex('idx_library_items_created_at')
    .on('library_items')
    .column('created_at')
    .execute()
  await sql`
    CREATE TRIGGER trg_library_items_updated_at
    AFTER UPDATE ON library_items
    FOR EACH ROW
    BEGIN
      UPDATE library_items SET updated_at = CURRENT_TIMESTAMP WHERE id = old.id;
    END;
  `.execute(db)

  // Create plugin_data table
  await db.schema
    .createTable('plugin_data')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('plugin_id', 'text', (col) => col.notNull())
    .addColumn('key', 'text', (col) => col.notNull())
    .addColumn('json_data', 'text', (col) => col.notNull().defaultTo('{}'))
    .addColumn('library_item_id', 'text', (col) => col.references('library_items.id'))
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute()

  // Create app_setting table
  await db.schema
    .createTable('app_setting')
    .addColumn('key', 'text', (col) => col.primaryKey().notNull())
    .addColumn('value', 'text', (col) => col.notNull().defaultTo('{}'))
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute()

  // Create collection_members table
  await db.schema
    .createTable('collection_members')
    .addColumn('collection_id', 'text', (col) => col.notNull().references('collections.id'))
    .addColumn('item_id', 'text', (col) => col.notNull()) // Refers to library_items.id or content_groups.id
    .addColumn('item_type', 'text', (col) => col.notNull()) // 'LibraryItem' or 'ContentGroup'
    .addColumn('item_order', 'integer', (col) => col.notNull())
    .addPrimaryKeyConstraint('collection_members_pk', ['collection_id', 'item_id'])
    .execute()

  await db.schema
    .createIndex('idx_collection_members_collection_id')
    .on('collection_members')
    .column('collection_id')
    .execute()
  await db.schema
    .createIndex('idx_collection_members_item_id')
    .on('collection_members')
    .column('item_id')
    .execute()

  // Create vocabulary_sources table
  await db.schema
    .createTable('vocabulary_sources')
    .addColumn('vocabulary_id', 'text', (col) => col.notNull().references('vocabulary_registry.id'))
    .addColumn('library_item_id', 'text', (col) => col.notNull().references('library_items.id'))
    .addColumn('context_sentence', 'text')
    .addColumn('start_offset', 'integer')
    .addColumn('end_offset', 'integer')
    .addColumn('timestamp_ms', 'integer')
    // No explicit PK, but a composite one could be (vocabulary_id, library_item_id, start_offset, end_offset) if needed
    .execute()

  await db.schema
    .createIndex('idx_vocabulary_sources_vocabulary_id')
    .on('vocabulary_sources')
    .column('vocabulary_id')
    .execute()
  await db.schema
    .createIndex('idx_vocabulary_sources_library_item_id')
    .on('vocabulary_sources')
    .column('library_item_id')
    .execute()
  await db.schema
    .createIndex('idx_vocabulary_sources_library_item_id_timestamp')
    .on('vocabulary_sources')
    .columns(['library_item_id', 'timestamp_ms'])
    .execute()

  // Create embedded_assets table
  await db.schema
    .createTable('embedded_assets')
    .addColumn('id', 'text', (col) => col.primaryKey().notNull())
    .addColumn('library_item_id', 'text', (col) => col.notNull().references('library_items.id'))
    .addColumn('storage_path', 'text', (col) => col.notNull().unique())
    .addColumn('format', 'text')
    .addColumn('original_src', 'text')
    .addColumn('width', 'integer')
    .addColumn('height', 'integer')
    .addColumn('size_bytes', 'integer')
    .addColumn('checksum', 'text')
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute()

  await db.schema
    .createIndex('idx_embedded_assets_library_item_id')
    .on('embedded_assets')
    .column('library_item_id')
    .execute()

  // Create supplementary_files table
  await db.schema
    .createTable('supplementary_files')
    .addColumn('id', 'text', (col) => col.primaryKey().notNull())
    .addColumn('library_item_id', 'text', (col) => col.notNull().references('library_items.id'))
    .addColumn('type', 'text', (col) => col.notNull())
    .addColumn('storage_path', 'text', (col) => col.notNull().unique())
    .addColumn('format', 'text')
    .addColumn('language', 'text')
    .addColumn('filename', 'text')
    .addColumn('size_bytes', 'integer')
    .addColumn('checksum', 'text')
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute()

  await db.schema
    .createIndex('idx_supplementary_files_library_item_id')
    .on('supplementary_files')
    .column('library_item_id')
    .execute()
  await db.schema
    .createIndex('idx_supplementary_files_type')
    .on('supplementary_files')
    .column('type')
    .execute()
  await db.schema
    .createIndex('idx_supplementary_files_language')
    .on('supplementary_files')
    .column('language')
    .execute()
}

export async function dropSchema(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('supplementary_files').ifExists().execute()
  await db.schema.dropTable('embedded_assets').ifExists().execute()
  await db.schema.dropTable('vocabulary_sources').ifExists().execute()
  await db.schema.dropTable('collection_members').ifExists().execute()
  await db.schema.dropTable('app_setting').ifExists().execute()
  await db.schema.dropTable('plugin_data').ifExists().execute()
  await db.schema.dropTable('library_items').ifExists().execute()
  await db.schema.dropTable('vocabulary_registry').ifExists().execute()
  await db.schema.dropTable('collections').ifExists().execute()
  await db.schema.dropTable('content_groups').ifExists().execute()

  // Triggers are dropped with tables in SQLite, but if created separately or for other DBs, drop them:
  // await db.raw(sql`DROP TRIGGER IF EXISTS trg_library_items_updated_at;`.text).execute()
  // await db.raw(sql`DROP TRIGGER IF EXISTS trg_content_groups_updated_at;`.text).execute()
  // await db.raw(sql`DROP TRIGGER IF EXISTS trg_collections_updated_at;`.text).execute()
}
