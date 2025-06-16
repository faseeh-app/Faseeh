import 'reflect-metadata'
import { container } from 'tsyringe'
import { FaseehApp } from '@shared/types/types'
import { ContentAdapterRegistry } from '@renderer/core/services/content-adapter/content-adapter-registry'
import { PluginManager } from '@renderer/core/services/plugins/plugin-manager'
import { MetadataScraperRegistry } from '@renderer/core/services/metadata-scraper/metadata-scraper-registry'
import { LanguageDetector } from '@renderer/core/services/language-detection/language-detector'
import { StorageService } from '@renderer/core/services/storage/storage-service'
import {
  ContentAdapterFacade,
  MetadataScraperFacade,
  PluginManagerFacade
} from '@renderer/core/services/facades/service-facades'
import { PluginUIRegistry } from '@renderer/core/services/plugin-ui/plugin-ui-registry'
import { PluginUIFacade } from '@renderer/core/services/facades/plugin-ui-facade'

// Service tokens for dependency injection
export const TOKENS = {
  Storage: 'Storage',
  ContentRegistry: 'ContentRegistry',
  PluginManager: 'PluginManager',
  MetadataRegistry: 'MetadataRegistry',
  LanguageDetector: 'LanguageDetector',
  PluginUIRegistry: 'PluginUIRegistry',
  FaseehApp: 'FaseehApp'
} as const

/**
 * Configure the dependency injection container
 */
function configureDI(): void {
  container.registerSingleton(TOKENS.Storage, StorageService)
  container.registerSingleton(TOKENS.LanguageDetector, LanguageDetector)

  const storageInstance = container.resolve<StorageService>(TOKENS.Storage)
  const languageDetectorInstance = container.resolve<LanguageDetector>(TOKENS.LanguageDetector)

  const faseehAppInstance: FaseehApp = {
    appInfo: {
      version: '1.1.0',
      platform: 'win'
    },
    storage: storageInstance,
    plugins: null as any,
    content: null as any,
    metadata: null as any,
    languageDetector: languageDetectorInstance,
    ui: null as any
  }
  container.registerInstance(TOKENS.FaseehApp, faseehAppInstance)

  const contentRegistryInstance = new ContentAdapterRegistry(storageInstance, faseehAppInstance)
  container.registerInstance(TOKENS.ContentRegistry, contentRegistryInstance)

  const metadataRegistryInstance = new MetadataScraperRegistry(faseehAppInstance)
  container.registerInstance(TOKENS.MetadataRegistry, metadataRegistryInstance)

  const pluginUIRegistryInstance = new PluginUIRegistry()
  container.registerInstance(TOKENS.PluginUIRegistry, pluginUIRegistryInstance)

  const pluginManagerInstance = new PluginManager(storageInstance, faseehAppInstance)
  container.registerInstance(TOKENS.PluginManager, pluginManagerInstance)

  faseehAppInstance.plugins = new PluginManagerFacade(pluginManagerInstance)
  faseehAppInstance.content = new ContentAdapterFacade(contentRegistryInstance)
  faseehAppInstance.metadata = new MetadataScraperFacade(metadataRegistryInstance)
  faseehAppInstance.ui = new PluginUIFacade(pluginUIRegistryInstance)
}

// Configure dependency injection
configureDI()

// Export direct access to services
export const contentRegistry = () =>
  container.resolve<ContentAdapterRegistry>(TOKENS.ContentRegistry)
export const pluginManager = () => container.resolve<PluginManager>(TOKENS.PluginManager)
export const metadataRegistry = () =>
  container.resolve<MetadataScraperRegistry>(TOKENS.MetadataRegistry)
export const languageDetector = () => container.resolve<LanguageDetector>(TOKENS.LanguageDetector)
export const storage = () => container.resolve<StorageService>(TOKENS.Storage)
export const pluginUIRegistry = () => container.resolve<PluginUIRegistry>(TOKENS.PluginUIRegistry)
export const faseehApp = () => container.resolve<FaseehApp>(TOKENS.FaseehApp)

// Track initialization state
let isInitialized = false
let isShuttingDown = false

/**
 * Initialize all services that require async initialization
 */
export async function initializeServices(): Promise<void> {
  if (isInitialized) {
    return
  }

  const pluginMgr = pluginManager()
  if (pluginMgr.initialize) {
    await pluginMgr.initialize()
  }
  // Set up the plugin UI registry in the panel state
  const { usePanelState } = await import('@renderer/common/composables/usePanelState')
  const { setPluginUIRegistry } = usePanelState()
  setPluginUIRegistry(pluginUIRegistry())

  isInitialized = true
}

/**
 * Cleanup method for graceful shutdown of all services
 */
export async function shutdownServices(): Promise<void> {
  if (isShuttingDown || !isInitialized) {
    return
  }

  isShuttingDown = true

  try {
    // Shutdown plugin manager
    const pluginMgr = pluginManager()
    if (pluginMgr.shutdown) {
      await pluginMgr.shutdown()
    }

    // Shutdown storage service
    const storageSvc = storage()
    if (storageSvc.shutdown) {
      await storageSvc.shutdown()
    }

    isInitialized = false
  } catch (error) {
  } finally {
    isShuttingDown = false
  }
}
