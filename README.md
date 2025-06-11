# Whisper Subtitle Engine (Minimal Mode)

This repository provides a **minimal, production-ready** implementation of Faseeh’s subtitle engine that uses OpenAI Whisper. Only four TypeScript source files are required:

| File                        | Purpose                                                             |
| --------------------------- | ------------------------------------------------------------------- |
| `engine.types.ts`           | Shared type definitions (`SubtitleOptions`, `SubtitleResult`, etc.) |
| `SubtitleEngine.ts`         | Abstract base class for all subtitle engines                        |
| `SubtitleEngineRegistry.ts` | Registers engines and orchestrates subtitle generation              |
| `OpenAIDirectEngine.ts`     | Concrete engine that calls Whisper API via HTTP                     |

All other TS files have been removed for minimal compliance.

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <this-repo>
cd Faseeh
npm install
```

### 2. Environment Variables

Create a `.env` file at the project root:

```env
WHISPER_API_KEY=your_whisper_key_here
```

`.gitignore` already prevents `.env` from being committed.

### 3. Run the Demo

```bash
# Compile TypeScript then run demo
npx tsc
node dist/test.js  # or tsx test.ts for ts-node/tsx
```

Expected output:

```bash
Starting subtitle engine test...
Attempting to generate subtitles for: /absolute/path/to/test.mp3
--- ✅ Subtitles Generated Successfully ---
1
00:00:00,000 --> 00:00:01,000
Hello, welcome to the show.

2
00:00:01,000 --> 00:00:03,000
Today we’re discussing Whisper models.
...
```

> **Note**: Place a short MP3 file named `test.mp3` in the repo root before running the demo.

---

## 📜 API Usage Example

```ts
import { SubtitleEngineRegistry } from './SubtitleEngineRegistry.js'
import { OpenAIDirectEngine } from './OpenAIDirectEngine.js'

const registry = new SubtitleEngineRegistry()
registry.register(new OpenAIDirectEngine({ id: 'openai', name: 'Whisper', type: 'direct' }))

const result = await registry.generateSubtitles({
  engineId: 'openai',
  audioData: new Blob([myAudioBuffer]),
  language: 'en',
  responseFormat: 'srt'
})
console.log(result.text)
```

---

## 🧪 Tests

Minimal demo in `test.ts` doubles as an integration test. Run it with `npm run test` after adding a script in `package.json` if desired.

---

## License

MIT
