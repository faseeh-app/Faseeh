import { describe, it, expect, beforeAll, vi } from 'vitest';
import { lookup } from '../dictionary.service';
import { DictionaryError } from '../dictionary.types';
import { LanguageDetector } from '../../language-detection/language-detector';

// Mock language detector
vi.mock('../../language-detection/language-detector', () => ({
  LanguageDetector: class {
    async detectLanguage(word: string): Promise<string | null> {
      // Map words to their expected languages
      const languageMap: Record<string, string> = {
        'bonjour': 'fra',
        'hello': 'eng',
        'hola': 'spa',
        'hallo': 'deu',
        'ciao': 'ita',
        'nonexistentword123': 'eng',
        'こんにちは': 'jpn'
      };
      return languageMap[word.toLowerCase()] || null;
    }
  }
}));

// Mock axios
vi.mock('axios', () => {
  const mockGet = vi.fn();
  
  return {
    default: {
      get: mockGet,
      isAxiosError: (error: unknown): error is any => {
        return error instanceof Error && error.name === 'AxiosError'
      }
    },
    AxiosError: class extends Error {
      response?: { status: number; data: any }
      constructor(message: string, response?: { status: number; data: any }) {
        super(message)
        this.name = 'AxiosError'
        this.response = response
      }
    }
  };
});

describe('Dictionary Service', () => {
  let mockGet: ReturnType<typeof vi.fn>;
  let mockAxios: any;

  beforeAll(async () => {
    // Log whether environment variables are set (without exposing values)
    console.log('Environment check:');
    console.log('- OXFORD_APP_ID is set:', !!process.env.OXFORD_APP_ID);
    console.log('- OXFORD_APP_KEY is set:', !!process.env.OXFORD_APP_KEY);

    // Get the mock function
    mockAxios = await vi.importMock('axios');
    mockGet = mockAxios.default.get;

    // Mock successful API responses
    mockGet.mockImplementation((url: string) => {
      const word = url.split('/').pop()?.toLowerCase();
      if (!word) throw new Error('Invalid URL');

      // Mock successful response
      if (['bonjour', 'hello', 'hola', 'hallo', 'ciao'].includes(word)) {
        return Promise.resolve({
          data: {
            id: word,
            metadata: { language: 'en-gb' },
            results: [{
              id: word,
              lexicalEntries: [{
                lexicalCategory: { id: 'noun', text: 'Noun' },
                entries: [{
                  pronunciations: [{ phoneticSpelling: word }],
                  senses: [{
                    definitions: [`Definition of ${word}`],
                    examples: [{ text: `Example using ${word}` }],
                    synonyms: [{ text: `synonym of ${word}` }]
                  }]
                }]
              }]
            }]
          }
        });
      }

      // Mock 404 for non-existent word
      if (word === 'nonexistentword123') {
        const error = new mockAxios.AxiosError('Not Found', {
          status: 404,
          data: { error: 'No entry found' }
        });
        return Promise.reject(error);
      }

      // Mock error for unsupported language
      if (word === 'こんにちは') {
        throw new DictionaryError('Unsupported language', 'UNSUPPORTED_LANGUAGE');
      }

      // Default error for other cases
      throw new DictionaryError('API error', 'API_ERROR');
    });
  });

  const testWords = ['bonjour', 'hello', 'hola', 'hallo', 'ciao'];
  
  testWords.forEach(word => {
    it(`should lookup word: ${word}`, async () => {
      const result = await lookup(word);
      
      // Basic structure validation
      expect(result).toBeDefined();
      expect(result.word).toBe(word.toLowerCase());
      expect(result.language).toBeDefined();
      expect(result.lexicalCategory).toBeDefined();
      expect(Array.isArray(result.definitions)).toBe(true);
      expect(Array.isArray(result.examples)).toBe(true);
      expect(Array.isArray(result.synonyms)).toBe(true);
      
      // Log the result for manual inspection
      console.log(`\nTest result for "${word}":`, JSON.stringify(result, null, 2));
    });
  });

  it('should throw error for unsupported language', async () => {
    const unsupportedWord = 'こんにちは'; // Japanese word
    await expect(lookup(unsupportedWord)).rejects.toThrow(DictionaryError);
  });

  it('should throw error for non-existent word', async () => {
    const nonExistentWord = 'nonexistentword123';
    await expect(lookup(nonExistentWord)).rejects.toThrow(DictionaryError);
  });
}); 