import { Token, TokenizerFunction } from '@shared/types/text-tokenizer-types';

// Common Arabic prefixes and suffixes
const ARABIC_PREFIXES = [
  'ال', 'وال', 'بال', 'كال', 'ولل', 'فلل', 'فال', 'وبال', 'فبال', 'كذلك',
  'والل', 'بالل', 'فالل', 'ولل', 'ولل', 'فالل', 'فال', 'وال', 'بال', 'كال'
];

const ARABIC_SUFFIXES = [
  'ه', 'ها', 'هما', 'هن', 'هما', 'هم', 'كن', 'نا', 'كما', 'كم',
  'كن', 'تم', 'ته', 'تها', 'تهما', 'تهن', 'تهم', 'تنا', 'تكما', 'تكم', 'تكن'
];

/**
 * Arabic text tokenizer that handles Arabic script, numbers, and common symbols.
 * Properly handles right-to-left text and Arabic-specific punctuation.
 */
export const arabicTokenizer: TokenizerFunction = (text: string): Token[] => {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const tokens: Token[] = [];
  const normalizedText = normalizeArabic(text);
  
  // Tokenize the text into potential tokens
  const potentialTokens = basicArabicTokenization(normalizedText);
  
  // Further process tokens to handle Arabic-specific cases
  for (const token of potentialTokens) {
    if (!token.isWord) {
      tokens.push(token);
      continue;
    }
    
    // Handle prefixes and suffixes for word tokens
    const processedTokens = processArabicToken(token, normalizedText);
    tokens.push(...processedTokens);
  }
  
  return tokens;
};

/**
 * Normalize Arabic text to handle different character representations
 */
function normalizeArabic(text: string): string {
  return text
    // Normalize Arabic characters (e.g., different forms of Alef)
    .replace(/[\u064B-\u065F\u0670\u0610-\u061A\u06D6-\u06ED]/g, '')
    // Normalize Arabic punctuation
    .replace(/[،؛؟]/g, ' $& ')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Basic tokenization of Arabic text
 */
function basicArabicTokenization(text: string): Token[] {
  const tokens: Token[] = [];
  
  // Match Arabic letters, numbers, or common punctuation
  const arabicRegex = /[\p{Script=Arabic}0-9]+|[^\p{Script=Arabic}\s]/gu;
  let match: RegExpExecArray | null;
  
  while ((match = arabicRegex.exec(text)) !== null) {
    const tokenText = match[0];
    const startIndex = match.index;
    const endIndex = startIndex + tokenText.length - 1;
    
    // Check if this is a word token (Arabic letters/numbers)
    const isWord = /[\p{Script=Arabic}0-9]/u.test(tokenText);
    
    tokens.push({
      text: tokenText,
      startIndex,
      endIndex,
      isWord
    });
  }
  
  return tokens;
}

/**
 * Process an Arabic token to handle prefixes and suffixes
 */
function processArabicToken(token: Token, originalText: string): Token[] {
  const result: Token[] = [];
  let currentText = token.text;
  let currentStart = token.startIndex;
  
  // Check for prefixes
  const prefixMatch = ARABIC_PREFIXES.find(prefix => 
    currentText.startsWith(prefix) && 
    currentText.length > prefix.length
  );
  
  if (prefixMatch) {
    // Add the prefix as a separate token
    result.push({
      text: prefixMatch,
      startIndex: currentStart,
      endIndex: currentStart + prefixMatch.length - 1,
      isWord: false
    });
    
    // Update current text and position
    currentText = currentText.slice(prefixMatch.length);
    currentStart += prefixMatch.length;
  }
  
  // Check for suffixes (in reverse order to match longest first)
  const suffixMatch = ARABIC_SUFFIXES
    .sort((a, b) => b.length - a.length) // Sort by length descending
    .find(suffix => 
      currentText.endsWith(suffix) && 
      currentText.length > suffix.length
    );
  
  if (suffixMatch) {
    const stemLength = currentText.length - suffixMatch.length;
    
    // Add the stem if it's not empty
    if (stemLength > 0) {
      result.push({
        text: currentText.slice(0, stemLength),
        startIndex: currentStart,
        endIndex: currentStart + stemLength - 1,
        isWord: true
      });
    }
    
    // Add the suffix
    result.push({
      text: currentText.slice(stemLength),
      startIndex: currentStart + stemLength,
      endIndex: token.endIndex,
      isWord: false
    });
  } else if (currentText.length > 0) {
    // No suffix found, add the remaining text as a word
    result.push({
      text: currentText,
      startIndex: currentStart,
      endIndex: token.endIndex,
      isWord: true
    });
  }
  
  return result;
}

export const arabicTokenizerInfo = {
  id: 'arabic-basic',
  name: 'Arabic Tokenizer',
  description: 'Tokenizes Arabic text, handling common prefixes/suffixes and Arabic script',
  languageCodes: ['ar', 'ar-*'], // Matches all Arabic language variants
  priority: 10 // Higher priority than the fallback tokenizer
};

/**
 * Register the Arabic tokenizer with the application
 * @param app The application instance
 */
export function registerArabicTokenizer(app: any): void {
  app.tokenizers.register({
    ...arabicTokenizerInfo,
    tokenize: arabicTokenizer
  });
  
  console.log('Arabic tokenizer registered successfully');
}

/**
 * Unregister the Arabic tokenizer
 * @param app The application instance
 */
export function unregisterArabicTokenizer(app: any): void {
  app.tokenizers.unregister(arabicTokenizerInfo.id);
  console.log('Arabic tokenizer unregistered');
}

export default {
  ...arabicTokenizerInfo,
  tokenize: arabicTokenizer
};


# Add all tokenizer files except the example
git add src/renderer/src/core/tokenizers/arabic-tokenizer.ts
git add src/renderer/src/core/tokenizers/english-tokenizer.ts
git add src/renderer/src/core/tokenizers/japanese-tokenizer.ts
git add src/renderer/src/core/tokenizers/whitespace-tokenizer.ts
git add src/renderer/src/core/services/default-tokenizers.ts

# Create commit with specific date
GIT_AUTHOR_DATE="2025-06-09T10:22:00" GIT_COMMITTER_DATE="2025-06-09T10:22:00" git commit -m "feat(tokenizer): implement language-specific tokenizers

- Add Arabic tokenizer with support for Arabic script and diacritics
- Add English tokenizer with contraction handling
- Add Japanese tokenizer using TinySegmenter
- Add fallback whitespace tokenizer
- Configure default tokenizers in registry"

# Push the changes
git push origin text_tokenization