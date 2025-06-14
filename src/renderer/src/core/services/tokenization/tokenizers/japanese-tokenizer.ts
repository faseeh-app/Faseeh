import { Token, TokenizerFunction } from '@shared/types/text-tokenizer-types';
import TinySegmenter from 'tiny-segmenter';

// Initialize the segmenter once
// @ts-ignore - TinySegmenter is a CommonJS module
export const segmenter = new (TinySegmenter.default || TinySegmenter)();

/**
 * Japanese text tokenizer using TinySegmenter
 */
export const japaneseTokenizer: TokenizerFunction = (text: string): Token[] => {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const tokens: Token[] = [];
  const segments = segmenter.segment(text);
  let currentPos = 0;
  
  for (const segment of segments) {
    if (!segment.trim()) {
      currentPos += segment.length;
      continue;
    }
    
    const startIndex = text.indexOf(segment, currentPos);
    if (startIndex === -1) {
      // Shouldn't happen, but just in case
      currentPos += segment.length;
      continue;
    }
    
    const endIndex = startIndex + segment.length - 1;
    
    // Simple heuristic: a token is a word if it's not just punctuation/whitespace
    const isWord = !/^[\s\p{P}\p{S}]+$/u.test(segment);
    
    tokens.push({
      text: segment,
      startIndex,
      endIndex,
      isWord
    });
    
    currentPos = endIndex + 1;
  }
  
  return tokens;
};

export const japaneseTokenizerInfo = {
  id: 'japanese-tinysegmenter',
  name: 'Japanese Tokenizer',
  description: 'Tokenizes Japanese text using TinySegmenter',
  languageCodes: ['ja', 'ja-JP', 'ja-Hira', 'ja-Hrkt'],
  priority: 10
};

/**
 * Register the Japanese tokenizer with the application
 * @param app The application instance
 */
export function registerJapaneseTokenizer(app: any): void {
  app.tokenizers.register({
    ...japaneseTokenizerInfo,
    tokenize: japaneseTokenizer
  });
  
  console.log('Japanese tokenizer registered successfully');
}

/**
 * Unregister the Japanese tokenizer
 * @param app The application instance
 */
export function unregisterJapaneseTokenizer(app: any): void {
  app.tokenizers.unregister(japaneseTokenizerInfo.id);
  console.log('Japanese tokenizer unregistered');
}

export default {
  ...japaneseTokenizerInfo,
  tokenize: japaneseTokenizer
};
