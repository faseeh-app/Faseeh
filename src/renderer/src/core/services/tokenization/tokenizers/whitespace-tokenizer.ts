import { Token, TokenizerFunction } from '@shared/types/text-tokenizer-types';

// Simple whitespace-based tokenizer that works for any language
export const whitespaceTokenizer: TokenizerFunction = (text: string): Token[] => {
  const tokens: Token[] = [];
  const words = text.split(/\s+/);
  let currentPos = 0;

  for (const word of words) {
    if (word) {
      tokens.push({
        text: word,
        startIndex: currentPos,
        endIndex: currentPos + word.length,
        isWord: /\w/.test(word) // Simple word check
      });
      currentPos += word.length;
    }
    currentPos++; // for the space
  }

  return tokens;
};

export const whitespaceTokenizerInfo = {
  id: 'core-whitespace',
  name: 'Whitespace Tokenizer',
  description: 'Simple whitespace-based tokenizer that works for any language',
  languageCodes: ['*'],
  priority: 0 // Lowest priority - used as fallback
};

export function registerWhitespaceTokenizer(registry: any): void {
  registry.register({
    ...whitespaceTokenizerInfo,
    tokenize: whitespaceTokenizer
  });
}

export function unregisterWhitespaceTokenizer(registry: any): void {
  registry.unregister(whitespaceTokenizerInfo.id);
}
