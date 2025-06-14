import {
  Token,
  TokenizerFunction,
  TokenizerInfo,
  TokenizerRegistration,
  ITokenizerRegistry
} from '@shared/types/text-tokenizer-types'

/**
 * Manages registration and selection of tokenizers
 * Implements the ITokenizerRegistry interface from the specification
 */
export class TokenizerRegistry implements ITokenizerRegistry {
  private tokenizers: Map<string, TokenizerRegistration> = new Map()
  private defaultLanguage = '*'

  /**
   * Register a new tokenizer
   */
  register(registration: TokenizerRegistration): void {
    if (this.tokenizers.has(registration.id)) {
      throw new Error(`Tokenizer with id '${registration.id}' is already registered`)
    }

    // Set default priority if not specified
    if (registration.priority === undefined) {
      registration.priority = 0
    }

    this.tokenizers.set(registration.id, registration)
  }

  /**
   * Unregister a tokenizer by ID
   */
  unregister(id: string): void {
    this.tokenizers.delete(id)
  }

  /**
   * Get a tokenizer for a specific language
   */
  getTokenizer(languageCode: string): TokenizerFunction | null {
    const tokenizer = this.findBestTokenizer(languageCode)
    return tokenizer ? tokenizer.tokenize : null
  }

  /**
   * Tokenize text using the best available tokenizer for the language
   * This is the main method specified in ITokenizerRegistry
   */
  async tokenizeText(text: string, languageCode: string = this.defaultLanguage): Promise<Token[]> {
    const tokenizer = this.findBestTokenizer(languageCode)

    if (!tokenizer) {
      throw new Error(`No tokenizer found for language: ${languageCode}`)
    }

    const result = tokenizer.tokenize(text)
    return result instanceof Promise ? result : Promise.resolve(result)
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use tokenizeText instead
   */
  async tokenize(text: string, languageCode: string = this.defaultLanguage): Promise<Token[]> {
    return this.tokenizeText(text, languageCode)
  }

  /**
   * List all registered tokenizers
   */
  listRegisteredTokenizers(): TokenizerInfo[] {
    return Array.from(this.tokenizers.values()).map((registration) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { tokenize, ...info } = registration
      return info
    })
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use listRegisteredTokenizers instead
   */
  listTokenizers(): TokenizerInfo[] {
    return this.listRegisteredTokenizers()
  }

  /**
   * Get a specific tokenizer by ID
   */
  getTokenizerById(id: string): TokenizerRegistration | null {
    return this.tokenizers.get(id) || null
  }

  /**
   * Find the best tokenizer for a language
   */
  private findBestTokenizer(languageCode: string): TokenizerRegistration | null {
    let bestMatch: TokenizerRegistration | null = null
    let bestScore = -1

    for (const tokenizer of this.tokenizers.values()) {
      // Check if this tokenizer supports the language
      const langSupported = tokenizer.languageCodes.some(
        (lang) => lang === languageCode || lang === '*'
      )

      if (langSupported) {
        const score = this.calculateScore(tokenizer, languageCode)
        if (score > bestScore) {
          bestScore = score
          bestMatch = tokenizer
        }
      }
    }

    return bestMatch
  }

  /**
   * Calculate a score for a tokenizer based on language match and priority
   */
  private calculateScore(tokenizer: TokenizerRegistration, languageCode: string): number {
    // Start with the tokenizer's priority
    let score = tokenizer.priority || 0

    // Bonus for exact language match
    if (tokenizer.languageCodes.includes(languageCode)) {
      score += 1000
    }
    // Bonus for wildcard match (less than exact match)
    else if (tokenizer.languageCodes.includes('*')) {
      score += 100
    }

    return score
  }
}

// Export a singleton instance
export const tokenizerRegistry = new TokenizerRegistry()
