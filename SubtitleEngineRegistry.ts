import { SubtitleEngine } from './SubtitleEngine'
import { EngineConfig, SubtitleOptions, SubtitleResult } from './engine.types'

/**
 * Manages and provides access to different subtitle engines.
 */
export class SubtitleEngineRegistry {
  private readonly engines: Map<string, SubtitleEngine<EngineConfig>> = new Map()

  /**
   * Registers a new subtitle engine.
   * @param engine - The engine instance to register.
   */
  public register(engine: SubtitleEngine<EngineConfig>): void {
    if (this.engines.has(engine.getId())) {
      console.warn(`Engine with ID '${engine.getId()}' is already registered. Overwriting.`)
    }
    this.engines.set(engine.getId(), engine)
    console.log(`Engine '${engine.getId()}' registered.`)
  }

  /**
   * Generates subtitles using the specified engine.
   * @param options - The options for subtitle generation, including the engine ID.
   * @returns A promise that resolves with the subtitle result.
   */
  public async generateSubtitles(options: SubtitleOptions): Promise<SubtitleResult> {
    const engine = this.engines.get(options.engineId)

    if (!engine) {
      throw new Error(`Subtitle engine with ID '${options.engineId}' not found.`)
    }

    const isAvailable = await engine.isAvailable()
    if (!isAvailable) {
      throw new Error(`Subtitle engine '${options.engineId}' is not available.`)
    }

    return engine.generateSubtitles(options)
  }

  /**
   * Gets a list of available engine IDs.
   * @returns An array of registered engine IDs.
   */
  public getAvailableEngines(): string[] {
    return Array.from(this.engines.keys())
  }
}
