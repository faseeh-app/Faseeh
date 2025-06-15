import { TokenizerRegistry } from '../text-tokenizer-registry'
import { whitespaceTokenizer, whitespaceTokenizerInfo } from './whitespace-tokenizer'
import { englishTokenizer, englishTokenizerInfo } from './english-tokenizer'
import { arabicTokenizer, arabicTokenizerInfo } from './arabic-tokenizer'
import { japaneseTokenizer, japaneseTokenizerInfo } from './japanese-tokenizer'

/**
 * Initializes and registers the default/core tokenizers that come with Faseeh
 * These provide essential tokenization functionality for core languages
 *
 * Priority Levels:
 * - 1000+: Specialized plugin tokenizers (e.g., Jieba for Chinese, MeCab for Japanese)
 * - 100-300: Language-specific tokenizers for core languages
 * - 0 to -100: Universal fallback tokenizers
 */
export function initializeDefaultTokenizers(registry: TokenizerRegistry): void {
  // ========================================
  // LANGUAGE-SPECIFIC TOKENIZERS
  // ========================================

  // Arabic Tokenizer
  registry.register({
    ...arabicTokenizerInfo,
    tokenize: arabicTokenizer
  })

  // English Tokenizer
  registry.register({
    ...englishTokenizerInfo,
    tokenize: englishTokenizer
  })

  // Japanese Tokenizer
  registry.register({
    ...japaneseTokenizerInfo,
    tokenize: japaneseTokenizer
  })

  // ========================================
  // UNIVERSAL FALLBACK TOKENIZERS
  // ========================================

  // Whitespace Tokenizer (ultimate fallback)
  registry.register({
    ...whitespaceTokenizerInfo,
    tokenize: whitespaceTokenizer
  })
}
