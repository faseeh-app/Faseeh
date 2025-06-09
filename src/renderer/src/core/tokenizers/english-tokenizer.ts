import { Token, TokenizerFunction } from '@shared/types/text-tokenizer-types';

// Match English words, contractions, and common punctuation
const WORD_REGEX = /[a-zA-Z]+(?:'[a-zA-Z]+)?/g;
const PUNCTUATION_REGEX = /[.,!?;:"]/g;

export const englishTokenizer: TokenizerFunction = (text: string): Token[] => {
  const tokens: Token[] = [];
  let match;

  // First handle words
  while ((match = WORD_REGEX.exec(text)) !== null) {
    tokens.push({
      text: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      isWord: true
    });
  }

  // Then handle punctuation
  while ((match = PUNCTUATION_REGEX.exec(text)) !== null) {
    tokens.push({
      text: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      isWord: false
    });
  }

  // Sort tokens by their position in the text
  return tokens.sort((a, b) => a.startIndex - b.startIndex);
};

export const englishTokenizerInfo = {
  id: 'english-basic',
  name: 'English Basic Tokenizer',
  description: 'Basic tokenizer for English text with support for contractions',
  languageCodes: ['en', 'en-US', 'en-GB'],
  priority: 10
};

export function registerEnglishTokenizer(registry: any): void {
  registry.register({
    ...englishTokenizerInfo,
    tokenize: englishTokenizer
  });
}

export function unregisterEnglishTokenizer(registry: any): void {
  registry.unregister(englishTokenizerInfo.id);
}