import SQLite from 'better-sqlite3'
import { Kysely, SqliteDialect, Migrator, FileMigrationProvider } from 'kysely'
import { app } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'
import type { Database as DBInterface } from '@root/src/shared/db'

// --- Singleton Instance Management ---
let kyselyInstance: Kysely<DBInterface> | undefined = undefined
let sqliteConnection: SQLite.Database | undefined = undefined

function initializeDatabaseInstances(): Kysely<DBInterface> {
  // If an old connection exists (e.g., from a previous HMR cycle), close it.
  if (sqliteConnection && sqliteConnection.open) {
    console.log('[DB] Closing existing SQLite connection before reinitialization.')
    sqliteConnection.close()
  }
  sqliteConnection = undefined
  kyselyInstance = undefined

  const dbDir = app.getPath('userData')
  const dbPath = path.join(dbDir, 'faseeh_metadata.db')
  console.log(`[DB] Initializing Kysely. DB path: ${dbPath}`)

  // Ensure the directory exists
  // fs.mkdirSync(dbDir, { recursive: true }); // fs.promises.mkdir is async, ensure sync or await if needed before SQLite constructor

  sqliteConnection = new SQLite(dbPath)

  const dialect = new SqliteDialect({
    database: sqliteConnection
  })

  kyselyInstance = new Kysely<DBInterface>({
    dialect
    // log(event) {
    //   if (event.level === 'query') {
    //     console.log('[Query]', event.query.sql, event.query.parameters)
    //   }
    // }
  })
  console.log('[DB] Kysely instance created.')
  return kyselyInstance
}

function getDb(): Kysely<DBInterface> {
  if (!kyselyInstance) {
    return initializeDatabaseInstances()
  }
  return kyselyInstance
}

export const db = getDb()

// --- Migrations ---
async function getMigrator(): Promise<Migrator> {
  const currentDb = getDb()
  const migrationsFolderPath = path.join(__dirname, 'migrations')

  // Ensure the migrations folder exists, or handle appropriately
  // This is more for local dev; in production, it should be packaged.
  try {
    await fs.access(migrationsFolderPath)
  } catch (error) {
    console.warn(
      `[DB] Migrations folder not found at ${migrationsFolderPath}. This might be normal if no migrations exist yet or if path is incorrect.`
    )
    // create the folder if needed
    // await fs.mkdir(migrationsFolderPath, { recursive: true });
  }

  return new Migrator({
    db: currentDb,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: migrationsFolderPath
    })
  })
}

export async function migrateToLatest(db: Kysely<DBInterface>): Promise<void> {
  const migrator = await getMigrator()
  const { error, results } = await migrator.migrateToLatest()

  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(`[DB] Migration "${it.migrationName}" was executed successfully`)
    } else if (it.status === 'Error') {
      console.error(`[DB] Failed to execute migration "${it.migrationName}"`)
    }
  })

  if (error) {
    console.error('[DB] Failed to migrate')
    console.error(error)
    throw error
  }
  if (!results || results.length === 0) {
    console.log('[DB] Database is already up to date.')
  }
}

// --- Lifecycle Management ---

// Graceful shutdown
app.on('will-quit', () => {
  if (sqliteConnection && sqliteConnection.open) {
    console.log('[DB] Closing SQLite connection on app quit.')
    sqliteConnection.close()
  }
  kyselyInstance = undefined
  sqliteConnection = undefined
})

// HMR support for Vite
if (import.meta.hot) {
  import.meta.hot.dispose(async () => {
    console.log('[DB] HMR dispose: Closing SQLite connection.')
    if (sqliteConnection && sqliteConnection.open) {
      sqliteConnection.close()
    }
    kyselyInstance = undefined
    sqliteConnection = undefined
  })
}
