import { SubtitleEngine } from './SubtitleEngine';
import { OpenAIConfig, SubtitleOptions, SubtitleResult, SubtitleEngineError } from './engine.types';
import * as dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Resolve the path to the .env file relative to this source file, so it
// works no matter where the app is executed from.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '.env');
dotenv.config({ path: envPath });

/**
 * A subtitle engine that uses the OpenAI Whisper API directly.
 */
export class OpenAIDirectEngine extends SubtitleEngine<OpenAIConfig> {
  /** Cached API key loaded from the environment. */
  private readonly apiKey: string =
    process.env.WHISPER_API_KEY ?? process.env.OPENAI_API_KEY ?? '';
  private readonly whisperApiUrl = 'https://api.openai.com/v1/audio/transcriptions';

  constructor(config: OpenAIConfig) {
    super(config);
  }

  public async initialize(): Promise<void> {
    if (!this.apiKey) {
      throw new SubtitleEngineError(
        'WHISPER_API_KEY environment variable is missing. Please create a .env file with the key.',
      );
    }
    console.log(`OpenAIDirectEngine ('${this.config.id}') initialized.`);
  }

  public async generateSubtitles(options: SubtitleOptions): Promise<SubtitleResult> {
    const formData = new FormData();
    // Provide a default filename, required by the API when using a Blob.
    formData.append('file', options.audioData, 'audio.mp3');
    formData.append('model', options.model || 'whisper-1');
    if (options.language) {
      formData.append('language', options.language);
    }
    const responseFormat = options.responseFormat || 'json';
    formData.append('response_format', responseFormat);

    try {
      const response = await fetch(this.whisperApiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'Unknown API error';
        try {
          const errorBody = await response.json();
          errorMessage = errorBody.error?.message || JSON.stringify(errorBody);
        } catch {
          // Response body is not JSON; fall back to plain text
          errorMessage = await response.text();
        }
        throw new SubtitleEngineError(`API request failed with status ${response.status}: ${errorMessage}`);
      }

      let responseText: string;
      if (responseFormat === 'json' || responseFormat === 'verbose_json') {
        const jsonResult = await response.json();
        responseText = jsonResult.text;
      } else {
        responseText = await response.text();
      }

      return {
        text: responseText,
        format: responseFormat,
      };
    } catch (error) {
      if (error instanceof SubtitleEngineError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new SubtitleEngineError(`An unexpected error occurred: ${error.message}`);
      }
      throw new SubtitleEngineError('An unknown error occurred during subtitle generation.');
    }
  }

  public async isAvailable(): Promise<boolean> {
    // A basic check for API key presence.
    return !!this.apiKey;
  }

  public async shutdown(): Promise<void> {
    // No-op for this engine.
    console.log(`OpenAIDirectEngine ('${this.config.id}') shut down.`);
  }
}
