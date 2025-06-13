# Faseeh: Learn Languages Through What You Love

Faseeh lets you turn your favorite content—books, podcasts, videos, social media—into personalized learning material. No rigid courses, no boring drills. Just real-life content, smart tools, and full control over how you learn.

**Why Faseeh?**  
✨ **Learn Anywhere, with Anything**: Use any digital material—learn from what already interests you.  
✨ **Expand with Plugins**: Build or install plugins for specific languages, skills, or styles.  
✨ **Collaborate & Share**: Join a global community to co-create resources, strategies, and plugins.  
✨ **All-in-One Toolkit**: Access Subtitles generation, dictionaries, pronunciation tools, and more in one place—no app-hopping.

> **Vision:** Faseeh operates on the principle that language acquisition thrives when aligned with personal interests and real-world contexts. Bridges the gap between education and daily life by transforming passive scrolling or reading into active learning, making mastery a natural result of exploring what fascinates you.

## ✅ Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar)

## 🚀 Getting Started

1. Clone the repo and install dependencies:

```bash
git clone https://github.com/FaseehApp/Faseeh.git
cd Faseeh
npm install
```

2. Start the app in development mode (hot‑reload enabled):

```bash
$ npm run dev
```

## 🛠️ Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```

## 🎯 Difficulty Estimation Feature

## Overview
The Difficulty Estimation feature analyzes text complexity using multiple linguistic algorithms to provide both general and personalized difficulty assessments for language learners.

## Features
- **Language Detection**: Automatically detects text language using the project's internal LanguageDetector service
- **Multi-Algorithm Analysis**: Implements three established readability metrics
- **TypeScript Support**: Fully typed implementation with comprehensive interfaces
- **Error Handling**: Graceful handling of unsupported languages and edge cases

## Algorithms Implemented

### 1. Flesch-Kincaid Readability Score
- **Purpose**: Measures text readability based on sentence length and syllable complexity
- **Formula**: `206.835 - (1.015 × ASL) - (84.6 × ASW)`
- **Output**: Score from 0-100 (higher = easier to read)

### 2. Gunning Fog Index
- **Purpose**: Estimates years of education needed to understand text
- **Formula**: `0.4 × [(words/sentences) + 100 × (complex words/words)]`
- **Output**: Grade level (e.g., 12 = high school level)

### 3. Lexical Density
- **Purpose**: Measures ratio of content words to total words
- **Formula**: `(Content Words / Total Words) × 100`
- **Output**: Percentage (higher = more information-dense)

## API Reference

### Main Function
```typescript
function estimateTextDifficulty(text: string, targetLanguage?: string): Promise<DifficultyResult | null>
```

### Interfaces
```typescript
interface DifficultyResult {
  language: string;
  generalLevel: {
    fleschKincaid: number;
    gunningFogIndex: number;
    lexicalDensity: number;
    overallScore: number;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  };
  textStats: {
    wordCount: number;
    sentenceCount: number;
    syllableCount: number;
    complexWords: number;
  };
}
```

## Usage Example
```typescript
import { estimateTextDifficulty } from './features/difficulty-estimation';

const text = "This is a sample text for difficulty analysis.";
const result = await estimateTextDifficulty(text, 'eng');

if (result) {
  console.log(`Language: ${result.language}`);
  console.log(`Difficulty Level: ${result.generalLevel.level}`);
  console.log(`Flesch-Kincaid Score: ${result.generalLevel.fleschKincaid}`);
}
```

## Testing
See testing section below for comprehensive test coverage.

## Integration
This feature integrates with:
- **Language Detection Service**: The project's core `LanguageDetector` service
- **Plugin System**: Ready for plugin architecture
- **Media Player**: For real-time text analysis

## Manual Testing

### Quick Test
```bash
# Run the estimator with sample text
npm run test:difficulty

# Or create a simple test script:
node -e "
const { estimateTextDifficulty } = require('./out/renderer/features/difficulty-estimation');
estimateTextDifficulty('The quick brown fox jumps over the lazy dog.').then(console.log);
"
```

### Test Cases
1. **Simple Text**: "The cat sat on the mat."
2. **Complex Text**: "The implementation of sophisticated algorithms requires comprehensive understanding of computational linguistics."
3. **Mixed Language**: Include non-English text to test language detection
4. **Edge Cases**: Empty string, single word, very long text

### Expected Outputs
- Simple text: Beginner level, high Flesch-Kincaid score
- Complex text: Advanced level, low Flesch-Kincaid score
- Proper language detection for all cases

## 📜 License

This project is licensed under the MIT License. See LICENSE for details.
