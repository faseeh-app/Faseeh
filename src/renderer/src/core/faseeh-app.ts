import 'reflect-metadata'
import {
  contentRegistry,
  pluginManager,
  metadataRegistry,
  languageDetector,
  faseehApp,
  initializeServices,
  shutdownServices
} from '@renderer/core/services/service-container'

export {
  contentRegistry,
  pluginManager,
  metadataRegistry,
  languageDetector,
  initializeServices,
  shutdownServices
}

export const Faseeh = faseehApp
