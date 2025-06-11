import { EngineConfig, SubtitleOptions, SubtitleResult } from './engine.types'

/**
 * Abstract base class for all subtitle engines.
 * It defines the common interface for initializing, generating subtitles,
 * checking availability, and shutting down an engine.
 *
 * @template TConfig - The configuration type for the engine.
 */
export abstract class SubtitleEngine<TConfig extends EngineConfig> {
  protected readonly config: TConfig

  constructor(config: TConfig) {
    this.config = config
  }

  /**
   * Initializes the engine. This can be used for setup tasks like
   * authenticating with an API.
   */
  public abstract initialize(): Promise<void>

  /**
   * Generates subtitles for the given audio data.
   * @param options - The options for subtitle generation.
   * @returns A promise that resolves with the subtitle result.
   */
  public abstract generateSubtitles(options: SubtitleOptions): Promise<SubtitleResult>

  /**
   * Checks if the engine is available and ready to be used.
   * @returns A promise that resolves with a boolean indicating availability.
   */
  public abstract isAvailable(): Promise<boolean>

  /**
   * Shuts down the engine and releases any resources.
   */
  public abstract shutdown(): Promise<void>

  /**
   * Gets the ID of the engine.
   */
  public getId(): string {
    return this.config.id
  }
}
