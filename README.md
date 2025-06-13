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

### Overview
The Difficulty Estimation feature provides a sophisticated analysis of text complexity, tailored for multiple languages. It uses a hybrid approach, combining established readability formulas with a custom scoring model to deliver nuanced and accurate difficulty assessments for language learners. The system is built to be robust, fully typed with TypeScript, and gracefully handles various edge cases.

### Features
- **Multi-Language Support**: Optimized for **English, French, Spanish, German, and Italian**. While it may process other Latin-script languages, accuracy is only guaranteed for this set.
- **Hybrid Scoring Model**:
    - For **English**, it uses a weighted average of the Flesch-Kincaid and Gunning Fog scores.
    - For **French, Spanish, German, and Italian**, it employs a custom two-factor model based on average sentence length and the percentage of long words (8+ characters), as syllable-based metrics are less reliable in these languages.
- **AST-Based Analysis**: Leverages the `retext` and `unified` ecosystems to perform analysis on an Abstract Syntax Tree (AST), ensuring accurate counts of sentences, words, syllables, and complex words.
- **TypeScript Support**: Fully typed implementation with comprehensive interfaces for predictable and safe integration.
- **Comprehensive Testing**: Includes a full suite of unit and integration tests to validate accuracy across all supported languages and numerous text types.

### Algorithms & Scoring

1.  **Flesch-Kincaid Reading Ease (English)**
    - **Purpose**: Measures text readability based on sentence length and syllable complexity.
    - **Output**: Score from 0-100 (higher = easier to read).

2.  **Gunning Fog Index (English)**
    - **Purpose**: Estimates the years of education needed to understand a text.
    - **Output**: A grade level (e.g., 12 = high school level).

3.  **Custom Two-Factor Model (French, Spanish, German, Italian)**
    - **Purpose**: Provides a reliable difficulty score when syllable counting is impractical.
    - **Factors**:
        1.  **Average Sentence Length**: The number of words per sentence.
        2.  **Word Complexity**: The percentage of "long words" (8 or more characters).
    - **Output**: A normalized score that is then mapped to a difficulty level.

### API Reference

#### Main Function
```typescript
function estimateTextDifficulty(text: string, targetLanguage?: string): Promise<DifficultyResult | null>
```

#### Interfaces
```typescript
interface DifficultyResult {
  language: string;
  generalLevel: {
    fleschKincaid: number;
    gunningFogIndex: number;
    lexicalDensity: number; // Currently a placeholder
    overallScore: number;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  };
  textStats: {
    wordCount: number;
    sentenceCount: number;
    syllableCount: number;
    complexWords: number;
    longWordCount: number; // New metric for non-English scoring
  };
}
```

### Usage Example
```typescript
import { estimateTextDifficulty } from './features/difficulty-estimation';

const text = "L'implémentation de systèmes computazionali avanzati richiede competenze specifiche.";
const result = await estimateTextDifficulty(text, 'ita');

if (result) {
  console.log(`Language: ${result.language}`);
  console.log(`Difficulty Level: ${result.generalLevel.level}`);
  console.log(`Long Word Count: ${result.textStats.longWordCount}`);
}
```

### Testing
To run the full test suite and validate the difficulty estimator across all supported languages:
```bash
npm test
```
This command executes all tests located in `src/renderer/src/features/difficulty-estimation/__tests__`.

## 📜 License

This project is licensed under the MIT License. See LICENSE for details.
