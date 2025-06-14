import { Token, TokenizerFunction } from '@shared/types/text-tokenizer-types';

// Match English words, contractions, numbers, and common punctuation
const WORD_REGEX = /[a-zA-Z]+(?:'[a-zA-Z]+)?/g;
const NUMBER_REGEX = /[0-9]+(?:[.,][0-9]+)*/g; // Handles integers, decimals, and comma-separated numbers
const PUNCTUATION_REGEX = /[.,!?;:"]/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

export const englishTokenizer: TokenizerFunction = (text: string): Token[] => {
  const tokens: Token[] = [];
  let match;

  // Handle email addresses first (to avoid splitting them)
  const emailRegex = new RegExp(EMAIL_REGEX.source, 'g');
  while ((match = emailRegex.exec(text)) !== null) {
    tokens.push({
      text: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      isWord: false // Email addresses are not regular words
    });
  }

  // Handle words and contractions
  const wordRegex = new RegExp(WORD_REGEX.source, 'g');
  while ((match = wordRegex.exec(text)) !== null) {
    // Skip if this position is already covered by an email
    const isOverlapping = tokens.some(token => 
      match.index >= token.startIndex && match.index < token.endIndex
    );
    
    if (!isOverlapping) {
      tokens.push({
        text: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        isWord: true
      });
    }
  }

  // Handle numbers
  const numberRegex = new RegExp(NUMBER_REGEX.source, 'g');
  while ((match = numberRegex.exec(text)) !== null) {
    // Skip if this position is already covered by an email or word
    const isOverlapping = tokens.some(token => 
      match.index >= token.startIndex && match.index < token.endIndex
    );
    
    if (!isOverlapping) {
      tokens.push({
        text: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        isWord: false // Numbers are not words
      });
    }
  }

  // Handle punctuation
  const punctuationRegex = new RegExp(PUNCTUATION_REGEX.source, 'g');
  while ((match = punctuationRegex.exec(text)) !== null) {
    // Skip if this position is already covered by another token
    const isOverlapping = tokens.some(token => 
      match.index >= token.startIndex && match.index < token.endIndex
    );
    
    if (!isOverlapping) {
      tokens.push({
        text: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        isWord: false
      });
    }
  }

  // Sort tokens by their position in the text
  return tokens.sort((a, b) => a.startIndex - b.startIndex);
};

export const englishTokenizerInfo = {
  id: 'english-basic',
  name: 'English Basic Tokenizer',
  description: 'Basic tokenizer for English text with support for contractions, numbers, and emails',
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