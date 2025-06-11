/**
 * Custom error for subtitle engine operations.
 */
export class SubtitleEngineError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SubtitleEngineError'
  }
}

/**
 * Configuration for a subtitle engine.
 * This is a base interface that can be extended for specific engines.
 */
export interface EngineConfig {
  readonly id: string
  readonly name: string
  readonly type: 'direct'
}

/**
 * Configuration specific to the OpenAI Direct engine.
 */
export interface OpenAIConfig extends EngineConfig {
  // No additional fields; API key is loaded from environment variables.
}

/**
 * Options for generating subtitles.
 */
export interface SubtitleOptions {
  readonly engineId: string
  readonly audioData: Blob
  readonly language?: string // ISO 639-1 format
  readonly responseFormat?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt'
  readonly model?: string
}

/**
 * The result of a subtitle generation operation.
 */
export interface SubtitleResult {
  readonly text: string
  readonly format: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt'
}
