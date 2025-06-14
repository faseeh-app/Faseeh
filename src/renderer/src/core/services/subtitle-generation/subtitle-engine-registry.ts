import { BaseSubtitleEngine } from './subtitle-engine'
import { SubtitleEngineInfo } from '@shared/types/types'

/**
 * Type for a subtitle engine constructor that can be instantiated
 */
type SubtitleEngineConstructor = new (info: SubtitleEngineInfo) => BaseSubtitleEngine

/**
 * Registry for managing subtitle engine implementations within Faseeh.
 *
 * This service acts as a central registry where the core application and plugins can
 * register different subtitle generation capabilities (local models, 3rd-party cloud
 * services via API keys). It allows other services (primarily Content Adapters) to find
 * and utilize the most appropriate or user-selected engine for generating subtitles
 * from audio or video sources.
 */
export class SubtitleEngineRegistry {
  private engines = new Map<
    string,
    {
      engineClass: SubtitleEngineConstructor
      info: SubtitleEngineInfo
      instance?: BaseSubtitleEngine
    }
  >()
  /**
   * Registers a subtitle engine implementation with the registry.
   *
   * @param engineClass The subtitle engine class that extends BaseSubtitleEngine
   * @param info Metadata describing the engine's capabilities
   * @throws Error if an engine with the same ID is already registered
   *   * @example
   * ```typescript
   * const engineInfo: SubtitleEngineInfo = {
   *   id: "whisper-cpp",
   *   name: "Whisper.cpp Local",
   *   supportedLanguages: ["en", "es", "fr"],
   *   inputType: ["audio", "video"],
   *   description: "Local Whisper implementation using whisper.cpp",
   *   isCloudService: false,
   *   requiresApiKey: false
   * };
   *
   * registry.register(MyWhisperEngine, engineInfo);
   * ```
   */
  register(engineClass: SubtitleEngineConstructor, info: SubtitleEngineInfo): void {
    if (this.engines.has(info.id)) {
      throw new Error(`Subtitle engine with ID '${info.id}' is already registered`)
    }

    this.engines.set(info.id, {
      engineClass,
      info,
      instance: undefined
    })
  }

  /**
   * Unregisters a subtitle engine from the registry.
   * If the engine has an active instance, it will be shut down before removal.
   *
   * @param engineId The ID of the engine to unregister
   * @throws Error if the engine is not registered
   */
  async unregister(engineId: string): Promise<void> {
    const registration = this.engines.get(engineId)
    if (!registration) {
      throw new Error(`Subtitle engine with ID '${engineId}' is not registered`)
    }

    // Shutdown the instance if it exists
    if (registration.instance) {
      await registration.instance.shutdown()
    }

    this.engines.delete(engineId)
  }
  /**
   * Gets a specific subtitle engine by its ID.
   * Creates and initializes the engine instance if it doesn't exist.
   *
   * @param engineId The ID of the engine to retrieve
   * @returns The initialized engine instance
   * @throws Error if the engine is not registered
   *
   * @example
   * ```typescript
   * const engine = await registry.getEngineById("whisper-cpp");
   * const result = await engine.generateSubtitles(audioData, ["en"]);
   * ```
   */
  async getEngineById(engineId: string): Promise<BaseSubtitleEngine> {
    const registration = this.engines.get(engineId)
    if (!registration) {
      throw new Error(`Subtitle engine with ID '${engineId}' is not registered`)
    }

    // Create and initialize instance if it doesn't exist
    if (!registration.instance) {
      registration.instance = new registration.engineClass(registration.info)
      await registration.instance.initialize()
    }

    return registration.instance
  }

  /**
   * Finds the best available engine based on the provided criteria.
   *
   * @param criteria Search criteria for finding a suitable engine
   * @returns The best matching engine instance, or null if none found
   *
   * @example
   * ```typescript
   * const engine = await registry.findBestEngine({
   *   languages: ["ja"],
   *   inputType: "video",
   *   preferLocal: true
   * });
   * ```
   */
  async findBestEngine(
    criteria: {
      languages?: string[]
      inputType?: 'audio' | 'video' | 'url'
      preferLocal?: boolean
      preferCloud?: boolean
    } = {}
  ): Promise<BaseSubtitleEngine | null> {
    const availableEngines = Array.from(this.engines.values())

    if (availableEngines.length === 0) {
      return null
    }

    // Filter engines based on criteria
    let candidateEngines = availableEngines.filter((registration) => {
      const { info } = registration

      // Check input type compatibility
      if (criteria.inputType && !info.inputType.includes(criteria.inputType)) {
        return false
      }

      // Check language support
      if (criteria.languages && criteria.languages.length > 0) {
        const hasLanguageSupport = criteria.languages.some(
          (lang) => info.supportedLanguages.includes(lang) || info.supportedLanguages.includes('*') // Support for universal engines
        )
        if (!hasLanguageSupport) {
          return false
        }
      }

      return true
    })

    if (candidateEngines.length === 0) {
      return null
    } // Apply preferences for local vs cloud
    if (criteria.preferLocal && !criteria.preferCloud) {
      const localEngines = candidateEngines.filter((reg) => !reg.info.isCloudService)
      if (localEngines.length > 0) {
        candidateEngines = localEngines
      }
    } else if (criteria.preferCloud && !criteria.preferLocal) {
      const cloudEngines = candidateEngines.filter((reg) => reg.info.isCloudService)
      if (cloudEngines.length > 0) {
        candidateEngines = cloudEngines
      }
    }

    // For now, return the first suitable engine
    // In the future, this could be enhanced with more sophisticated ranking
    const selectedRegistration = candidateEngines[0]

    return await this.getEngineById(selectedRegistration.info.id)
  }

  /**
   * Returns a list of all registered subtitle engines with their metadata.
   *
   * @returns Array of engine information objects
   */
  listRegisteredEngines(): SubtitleEngineInfo[] {
    return Array.from(this.engines.values()).map((registration) => registration.info)
  }

  /**
   * Checks if an engine with the given ID is registered.
   *
   * @param engineId The ID to check
   * @returns True if the engine is registered, false otherwise
   */
  isEngineRegistered(engineId: string): boolean {
    return this.engines.has(engineId)
  }

  /**
   * Gets the count of registered engines.
   *
   * @returns The number of registered engines
   */
  getEngineCount(): number {
    return this.engines.size
  }

  /**
   * Shuts down all initialized engine instances and clears the registry.
   * This should be called during application shutdown.
   */
  async shutdown(): Promise<void> {
    const shutdownPromises: Promise<void>[] = []

    for (const registration of this.engines.values()) {
      if (registration.instance) {
        shutdownPromises.push(registration.instance.shutdown())
      }
    }

    await Promise.all(shutdownPromises)
    this.engines.clear()
  }
  /**
   * Gets engines filtered by their capabilities.
   *
   * @param filter Filter criteria
   * @returns Array of matching engine information
   */
  getEnginesByCapability(filter: {
    supportsLanguage?: string
    inputType?: 'audio' | 'video' | 'url'
    requiresApiKey?: boolean
    isCloudService?: boolean
  }): SubtitleEngineInfo[] {
    return Array.from(this.engines.values())
      .filter((registration) => {
        const { info } = registration

        if (filter.supportsLanguage && !info.supportedLanguages.includes(filter.supportsLanguage)) {
          return false
        }

        if (filter.inputType && !info.inputType.includes(filter.inputType)) {
          return false
        }

        if (filter.requiresApiKey !== undefined && info.requiresApiKey !== filter.requiresApiKey) {
          return false
        }

        if (filter.isCloudService !== undefined && info.isCloudService !== filter.isCloudService) {
          return false
        }

        return true
      })
      .map((registration) => registration.info)
  }
}
