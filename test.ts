import { SubtitleEngineRegistry } from './SubtitleEngineRegistry.js'
import { OpenAIDirectEngine } from './OpenAIDirectEngine.js'
import { type OpenAIConfig, type SubtitleOptions } from './engine.types.js'
import * as fs from 'fs'
import * as https from 'https'
import * as path from 'path'
import { fileURLToPath } from 'url'

// Since we are in an ES module, __dirname is not available directly.
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function runTest(): Promise<void> {
  console.log('Starting subtitle engine test...');
  let openAIEngine: OpenAIDirectEngine | undefined;

  try {
    const openAIConfig: OpenAIConfig = {
      id: 'openai-direct',
      name: 'OpenAI Direct Whisper',
      type: 'direct',
    };

    openAIEngine = new OpenAIDirectEngine(openAIConfig);
    await openAIEngine.initialize();

    const registry = new SubtitleEngineRegistry();
    registry.register(openAIEngine);

    const audioFilePath = path.resolve(__dirname, 'test-audio.mp3');
    const audioUrl = 'https://cdn.jsdelivr.net/gh/langjam/langjam@main/examples/bilingual-diaries/data/1.mp3';

    if (!fs.existsSync(audioFilePath)) {
      console.log(`Test audio file not found. Downloading from ${audioUrl}...`);
      try {
        await new Promise((resolve, reject) => {
          const file = fs.createWriteStream(audioFilePath);
          https.get(audioUrl, (response) => {
            if (response.statusCode !== 200) {
              reject(new Error(`Failed to download audio file. Status code: ${response.statusCode}`));
              return;
            }
            response.pipe(file);
            file.on('finish', () => {
              file.close();
              console.log('Download complete.');
              resolve(undefined);
            });
          }).on('error', (err) => {
            fs.unlink(audioFilePath, () => {}); // Delete the file if download fails
            reject(err);
          });
        });
      } catch (downloadError) {
        console.error('\n[ERROR] Failed to download test audio file.');
        if (downloadError instanceof Error) {
            console.error(`Error: ${downloadError.message}`);
        }
        return;
      }
    }

    const audioBuffer = fs.readFileSync(audioFilePath);
    const audioBlob = new Blob([audioBuffer]);

    const subtitleOptions: SubtitleOptions = {
      engineId: 'openai-direct',
      audioData: audioBlob,
      language: 'en',
      responseFormat: 'srt',
    };

    console.log(`Attempting to generate subtitles for: ${audioFilePath}`);
    const result = await registry.generateSubtitles(subtitleOptions);
    console.log('\n--- ✅ Subtitles Generated Successfully ---\n');
    console.log(result.text);
    console.log('\n----------------------------------------\n');
  } catch (error) {
    console.error('\n--- ❌ Error Generating Subtitles ---\n');
    if (error instanceof Error) {
      console.error(`Error Name: ${error.name}`);
      console.error(`Error Message: ${error.message}`);
    } else {
      console.error('An unknown error occurred:', error);
    }
    console.log('\n-------------------------------------\n');
  } finally {
    if (openAIEngine) {
      await openAIEngine.shutdown();
    }
  }
}

runTest()
