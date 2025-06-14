// @ts-ignore - Will be fixed when axios is installed
import axios, { AxiosError } from 'axios';
import { LanguageDetector } from '../language-detection/language-detector';
import {
  DictionaryEntry,
  DictionaryError,
  LanguageCode,
  LANGUAGE_CODE_MAP,
  OxfordDictionaryResponse
} from './dictionary.types';

const OXFORD_API_BASE = 'https://od-api-sandbox.oxforddictionaries.com/api/v2';
const languageDetector = new LanguageDetector();

async function validateLanguage(word: string): Promise<LanguageCode> {
  const detectedLang = await languageDetector.detectLanguage(word);
  const supportedLanguages = Object.keys(LANGUAGE_CODE_MAP) as Array<keyof typeof LANGUAGE_CODE_MAP>;
  
  if (!detectedLang || !supportedLanguages.some(lang => lang === detectedLang)) {
    throw new DictionaryError(
      'Unsupported or undetectable language.',
      'UNSUPPORTED_LANGUAGE'
    );
  }
  
  return detectedLang as LanguageCode;
}

function normalizeOxfordResponse(
  response: OxfordDictionaryResponse,
  word: string,
  language: LanguageCode
): DictionaryEntry {
  const lexicalEntry = response.results[0]?.lexicalEntries[0];
  if (!lexicalEntry) {
    throw new DictionaryError('Invalid response structure', 'INVALID_RESPONSE');
  }

  const entry = lexicalEntry.entries[0];
  const sense = entry?.senses[0];

  return {
    word,
    language,
    lexicalCategory: lexicalEntry.lexicalCategory.text,
    phonetic: lexicalEntry.pronunciations?.[0]?.phoneticSpelling,
    definitions: sense?.definitions || [],
    examples: sense?.examples?.map((ex: { text: string }) => ex.text) || [],
    synonyms: sense?.synonyms?.map((syn: { text: string }) => syn.text) || [],
  };
}

export async function lookup(word: string): Promise<DictionaryEntry> {
  try {
    const language = await validateLanguage(word);
    const oxfordLangCode = LANGUAGE_CODE_MAP[language];
    
    // @ts-ignore - Will be fixed when @types/node is installed
    const appId = process.env.OXFORD_APP_ID;
    // @ts-ignore - Will be fixed when @types/node is installed
    const appKey = process.env.OXFORD_APP_KEY;
    
    if (!appId || !appKey) {
      throw new DictionaryError('Missing Oxford API credentials', 'API_ERROR');
    }

    const response = await axios.get<OxfordDictionaryResponse>(
      `${OXFORD_API_BASE}/entries/${oxfordLangCode}/${word.toLowerCase()}`,
      {
        params: {
          fields: 'definitions,examples,synonyms',
          strictMatch: false
        },
        headers: {
          'app_id': appId,
          'app_key': appKey,
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('[Dictionary] %s ➜', word, response.data);
    return normalizeOxfordResponse(response.data, word, language);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        throw new DictionaryError('Word not found', 'WORD_NOT_FOUND');
      }
      if (axiosError.response?.status === 403) {
        throw new DictionaryError('API credentials invalid or quota exceeded', 'API_ERROR');
      }
    }
    if (error instanceof DictionaryError) {
      throw error;
    }
    throw new DictionaryError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      'API_ERROR'
    );
  }
} 