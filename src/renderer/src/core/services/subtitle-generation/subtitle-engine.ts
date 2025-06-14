import {
  SubtitleEngineInfo,
  SubtitleGenerationResult,
  SubtitleSourceData
} from '@shared/types/types'

/**
 * Abstract base class for subtitle generation engines.
 *
 * This class provides a common interface for different subtitle generation implementations
 * (e.g., Whisper, cloud-based services, etc.). All subtitle engines must extend this class
 * and implement the required abstract methods.
 *
 * @abstract
 * @example
 * ```typescript
 * class WhisperEngine extends BaseSubtitleEngine {
 *   constructor() {
 *     super({
 *       name: "Whisper",
 *       version: "1.0.0",
 *       supportedFormats: ["mp3", "wav", "mp4"]
 *     });
 *   }
 *
 *   async generateSubtitles(source, languages, options) {
 *     // Implementation specific to Whisper
 *   }
 * }
 * ```
 */
export abstract class BaseSubtitleEngine {
  public readonly info: SubtitleEngineInfo
  /**
   * Constructs a new instance of a BaseSubtitleEngine.
   * @param {SubtitleEngineInfo} info - Metadata about the subtitle engine's capabilities.
   */
  constructor(info: SubtitleEngineInfo) {
    this.info = info
  }

  /**
   * Generates subtitles for the given source. MUST be implemented by subclasses.
   * @abstract
   * @param {SubtitleSourceData} source - The audio/video data or path/URL.
   * @param {string[]} languages - Language hints (target languages). May only support one target lang depending on engine.
   * @param {Record<string, any>} [options] - Engine-specific options (e.g., quality settings, task type).
   * @returns {Promise<SubtitleGenerationResult>} A promise resolving to the structured subtitle result.
   */
  abstract generateSubtitles(
    source: SubtitleSourceData,
    languages: string[], // May only support one target lang depending on engine
    options?: Record<string, any>
  ): Promise<SubtitleGenerationResult>

  /**
   * Optional method to perform any asynchronous initialization tasks required by the engine.
   * Subclasses can override this method to set up resources or connections.
   * @returns {Promise<void>} A promise that resolves when initialization is complete.
   * @example
   * ```typescript
   * async initialize() {
   *   // Perform setup tasks like loading models or connecting to a service
   *   await this.loadModel();
   *   console.log(`${this.info.name} initialized.`);
   * }
   * ```
   */
  async initialize(): Promise<void> {}

  /**
   * Optional method to cleanly shut down the engine and release any resources.
   * Subclasses can override this method to perform cleanup tasks.
   * @returns {Promise<void>} A promise that resolves when shutdown is complete.
   * @example
   * ```typescript
   * async shutdown() {
   *   // Perform cleanup tasks like releasing models or closing connections
   *   await this.releaseModel();
   *   console.log(`${this.info.name} has been shut down.`);
   * }
   * ```
   */
  async shutdown(): Promise<void> {}
}
