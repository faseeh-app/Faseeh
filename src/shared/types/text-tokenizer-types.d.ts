/**
 * Represents a single token identified in the text
 */
export interface Token {
  text: string // The actual token string (e.g., "Hello", ",", "世界")
  startIndex: number // Start index in the original raw text (inclusive)
  endIndex: number // End index in the original raw text (inclusive)
  isWord: boolean // Heuristic: is this likely a word vs punctuation/whitespace?
}

/**
 * Metadata describing a Tokenizer's capabilities
 */
export interface TokenizerInfo {
  id: string // Unique identifier (e.g., 'arabic-tokenizer')
  name: string // Human-readable name
  description?: string // Optional description
  languageCodes: string[] // Array of supported language codes (e.g., ['ar', 'en'])
  priority?: number // Higher number = higher priority when multiple tokenizers match
}

/**
 * The core tokenizer function type that takes text and returns tokens
 * Can be either synchronous or asynchronous
 */
export type TokenizerFunction = (text: string) => Token[] | Promise<Token[]>

/**
 * The registration object containing both metadata and the tokenize function
 */
export interface TokenizerRegistration extends TokenizerInfo {
  tokenize: TokenizerFunction
}

/**
 * Interface defining the public contract for the Text Tokenizer Registry service
 */
export interface ITokenizerRegistry {
  /**
   * Registers a new Tokenizer function.
   * @param registration - The complete registration object including metadata and the tokenize function.
   */
  register(registration: TokenizerRegistration): void

  /**
   * Unregisters a Tokenizer by its unique ID.
   * @param id - The unique ID of the tokenizer to unregister.
   */
  unregister(id: string): void

  /**
   * Finds and executes the best available tokenizer for the given text and language.
   * @param text - The raw text string to tokenize.
   * @param languageCode - The ISO 639 language code of the text.
   * @returns A promise resolving to an array of Token objects.
   */
  tokenizeText(text: string, languageCode: string): Promise<Token[]>

  /**
   * Retrieves metadata about all currently registered tokenizers.
   * @returns An array of TokenizerInfo objects.
   */
  listRegisteredTokenizers(): TokenizerInfo[]

  /**
   * Retrieves a specific Tokenizer registration by its ID (including the function).
   * Returns null if not found.
   * @param id - The unique ID of the desired tokenizer.
   * @returns The TokenizerRegistration object or null.
   */
  getTokenizerById(id: string): TokenizerRegistration | null
}

/**
 * Facade interface for tokenizer functionality exposed to plugins
 */
export interface TokenizerRegistryFacade {
  /**
   * Register a new tokenizer
   */
  register(registration: TokenizerRegistration): void

  /**
   * Unregister a tokenizer by ID
   */
  unregister(id: string): void

  /**
   * Tokenize text using the best available tokenizer for the language
   */
  tokenizeText(text: string, languageCode?: string): Promise<Token[]>

  /**
   * List all registered tokenizers
   */
  listRegisteredTokenizers(): TokenizerInfo[]

  /**
   * Get a specific tokenizer by ID
   */
  getTokenizerById(id: string): TokenizerRegistration | null
}