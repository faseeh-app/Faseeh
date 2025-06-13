import { francAll } from 'franc'

export class LanguageDetector {
  async detectLanguage(source: string): Promise<string | null> {
    if (!source || source.trim().length < 10) {
      return null
    }

    try {
      const results = francAll(source, {
        whitelist: ['eng', 'fra', 'spa', 'deu', 'ita']
      })

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
