import { FaseehApp } from '@shared/types/types'
import { ContentAdapterRegistry } from '@renderer/core/services/content-adapter/content-adapter-registry'
import { PluginManager } from '@renderer/core/services/plugins/plugin-manager'
import { MetadataScraperRegistry } from '@renderer/core/services/metadata-scraper/metadata-scraper-registry'
import { LanguageDetector } from '@renderer/core/services/language-detection/language-detector'
import { storage } from '@renderer/core/services/storage/storage-service'

export const contentRegistry = new ContentAdapterRegistry()
export const pluginManager = new PluginManager()
export const metadataRegistry = new MetadataScraperRegistry()
export const langDetector = new LanguageDetector()

export const Faseeh: FaseehApp = {
  appInfo: {
    version: '1.1.0',
    platform: 'win'
  },
  storage: storage,
  plugins: pluginManager,
  content: contentRegistry,
  metadata: metadataRegistry,
  languageDetector: langDetector
}

contentRegistry.setApp(Faseeh)
pluginManager.setApp(Faseeh)
metadataRegistry.setApp(Faseeh)
