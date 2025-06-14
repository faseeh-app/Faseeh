/**
 * Supported language codes for dictionary lookups
 */
export type LanguageCode = 'eng' | 'fra' | 'spa' | 'deu' | 'ita';

/**
 * Oxford Dictionaries API language codes
 */
export type OxfordLanguageCode = 'en-gb' | 'fr' | 'es' | 'de' | 'it';

/**
 * Mapping from internal language codes to Oxford API language codes
 */
export const LANGUAGE_CODE_MAP = {
  eng: 'en-gb',
  fra: 'fr',
  spa: 'es',
  deu: 'de',
  ita: 'it'
} as const;

/**
 * Dictionary entry structure returned by the lookup function
 */
export interface DictionaryEntry {
  word: string;
  language: LanguageCode;
  lexicalCategory: string;
  phonetic?: string;
  definitions: string[];
  examples: string[];
  synonyms: string[];
  images?: string[];
}

/**
 * Custom error class for dictionary-related errors
 */
export class DictionaryError extends Error {
  constructor(
    message: string,
    public readonly code: 'UNSUPPORTED_LANGUAGE' | 'WORD_NOT_FOUND' | 'API_ERROR' | 'INVALID_RESPONSE' = 'API_ERROR'
  ) {
    super(message);
    this.name = 'DictionaryError';
  }
}

/**
 * Oxford Dictionaries API response structure
 */
export interface OxfordDictionaryResponse {
  id: string;
  metadata: {
    operation: string;
    provider: string;
    schema: string;
  };
  results: Array<{
    id: string;
    language: string;
    lexicalEntries: Array<{
      lexicalCategory: {
        id: string;
        text: string;
      };
      pronunciations?: Array<{
        phoneticSpelling: string;
      }>;
      entries: Array<{
        senses: Array<{
          definitions?: string[];
          examples?: Array<{
            text: string;
          }>;
          synonyms?: Array<{
            text: string;
          }>;
        }>;
      }>;
    }>;
  }>;
} 