import 'reflect-metadata'
import { francAll } from 'franc'
import { ILanguageDetector } from '@shared/types/types'

export class LanguageDetector implements ILanguageDetector {
  async detectLanguage(source: string): Promise<string | null> {
    if (!source || source.trim().length < 10) {
      return null
    }

    try {
      const results = francAll(source)

      if (results.length === 0) {
        return null
      }
      const [bestResult] = results
      const languageCode = bestResult[0]

      if (languageCode === 'und') {
        return null
      }

      return languageCode
    } catch (error) {
      console.error('Language detection failed:', error)
      return null
    }
  }
}
