import { Token, TokenizerFunction } from '@shared/types/text-tokenizer-types'
import TinySegmenter from 'tiny-segmenter'

// Initialize the segmenter once with proper error handling
const createSegmenter = () => {
  try {
    // Handle both CommonJS and ES module exports
    const SegmenterClass = TinySegmenter.default || TinySegmenter
    return new SegmenterClass()
  } catch (error) {
    console.error('Failed to initialize TinySegmenter:', error)
    throw new Error('Japanese tokenizer initialization failed')
  }
}

export const segmenter = createSegmenter()

/**
 * Japanese text tokenizer using TinySegmenter
 */
export const japaneseTokenizer: TokenizerFunction = (text: string): Token[] => {
  if (!text || typeof text !== 'string') {
    return []
  }

  const tokens: Token[] = []
  const segments = segmenter.segment(text)
  let currentPos = 0

  for (const segment of segments) {
    // Skip empty segments but still advance position
    if (!segment) {
      continue
    }

    // More reliable position tracking
    const startIndex = currentPos
    const endIndex = startIndex + segment.length - 1

    // Only create tokens for non-whitespace segments
    if (segment.trim()) {
      // Simple heuristic: a token is a word if it's not just punctuation/whitespace
      const isWord = !/^[\s\p{P}\p{S}]+$/u.test(segment)

      tokens.push({
        text: segment,
        startIndex,
        endIndex,
        isWord
      })
    }

    currentPos += segment.length
  }

  return tokens
}

export const japaneseTokenizerInfo = {
  id: 'japanese-tinysegmenter',
  name: 'Japanese Tokenizer',
  description: 'Tokenizes Japanese text using TinySegmenter',
  languageCodes: ['ja', 'ja-JP', 'ja-Hira', 'ja-Hrkt'],
  priority: 10
}

/**
 * Register the Japanese tokenizer with the application
 * @param app The application instance
 */
export function registerJapaneseTokenizer(app: any): void {
  app.tokenizers.register({
    ...japaneseTokenizerInfo,
    tokenize: japaneseTokenizer
  })

  console.log('Japanese tokenizer registered successfully')
}

/**
 * Unregister the Japanese tokenizer
 * @param app The application instance
 */
export function unregisterJapaneseTokenizer(app: any): void {
  app.tokenizers.unregister(japaneseTokenizerInfo.id)
  console.log('Japanese tokenizer unregistered')
}

export default {
  ...japaneseTokenizerInfo,
  tokenize: japaneseTokenizer
}
