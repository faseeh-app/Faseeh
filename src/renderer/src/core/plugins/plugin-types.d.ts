import { EventEmitterWrapper } from '@shared/utilities/event-system/event-emitter-wrapper'
import { EventType, Handler } from '@shared/types/event-types'
import {
  EventType,
  Handler,
  PluginEvents,
  StorageEvents,
  WorkspaceEvents
} from '@shared/types/event-types'
import { IStorageAPI } from '@shared/types/storage-api'

/**
 * Represents a plugin's manifest.json information
 */
export interface PluginManifest {
  // Required
  id: string
  name: string
  version: string
  minAppVersion: string
  main: string // Relative path to entry point JS

  // Optional dependency on other plugins
  pluginDependencies?: string[] // Array of required plugin IDs

  // Recommended
  description: string
  author?: string
  authorUrl?: string
  fundingUrl?: string
}

/**
 * Information about a plugin including its runtime status
 */
export interface PluginInfo {
  manifest: PluginManifest
  isEnabled: boolean
  isLoaded: boolean
  hasFailed: boolean
  error?: string
}

/**
 * The FaseehApp object provides plugins with access to application functionality
 */
export interface FaseehApp {
  /** Basic application information */
  appInfo: {
    readonly version: string
    readonly platform: 'win' | 'mac' | 'linux'
  }

  /** Storage API facade for accessing the main process storage service */
  storage: IStorageAPI

  /** Access to other plugins */
  plugins: {
    getPlugin(id: string): BasePlugin | null
  }

  /** Methods for displaying notifications to users */
  //   notifications: {
  //     info(msg: string): void
  //     warn(msg: string): void
  //     error(msg: string): void
  //   }

  // Shared event emitters
  workspaceEvents: EventEmitterWrapper<WorkspaceEvents>
  storageEvents: EventEmitterWrapper<StorageEvents>
  pluginEvents: EventEmitterWrapper<PluginEvents>
}

/**
 * BasePlugin abstract class interface that all plugins must implement
 */
export interface BasePlugin {
  app: FaseehApp
  manifest: PluginManifest

  /** Called when the plugin is loaded */
  onload(): Promise<void>

  /** Called when the plugin is unloaded */
  onunload(): void | Promise<void>

  /** Call the event emitter's `on` inside this method to clean up listeners automatically */
  registerEvent(disposer: () => void): void

  // --- Database Storage Methods ---

  /** Load plugin data from database storage */
  loadData(): Promise<any>

  /** Save plugin data to database storage */
  saveData(data: any): Promise<void>

  /**
   * Load plugin data from database storage with library item context
   * @param libraryItemId Optional library item ID to scope the data to
   */
  loadDataWithContext(libraryItemId: string | null): Promise<any>

  /**
   * Save plugin data to database storage with library item context
   * @param data The data to save
   * @param libraryItemId Optional library item ID to scope the data to
   */
  saveDataWithContext(data: any, libraryItemId: string | null): Promise<void>

  // --- File Storage Methods ---

  /**
   * Read plugin data from file storage
   * @param relativePath Path relative to plugin's data directory
   */
  readDataFile(relativePath: string): Promise<string | undefined>

  /**
   * Write plugin data to file storage
   * @param relativePath Path relative to plugin's data directory
   * @param content Content to write to the file
   */
  writeDataFile(relativePath: string, content: string): Promise<boolean>

  /**
   * Delete plugin data file
   * @param relativePath Path relative to plugin's data directory
   */
  deleteDataFile(relativePath: string): Promise<boolean>

  /**
   * List files in plugin's data directory
   * @param subDirectory Optional subdirectory within plugin's data directory
   */
  listDataFiles(subDirectory?: string): Promise<string[]>

  // --- Internal Methods ---

  /** Internal method to clean up all registered listeners */
  _cleanupListeners(): void
}
