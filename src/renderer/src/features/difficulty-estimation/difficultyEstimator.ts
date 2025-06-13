import { LanguageDetector } from '../../core/services/language-detection/language-detector.js'
import { analyzeText } from './algorithms.js'
import { DifficultyResult } from './types.js'

// Supported languages for difficulty estimation
const SUPPORTED_LANGUAGES = new Set(['eng', 'fra', 'spa', 'deu', 'ita'])

function getDifficultyLevel(
  overallScore: number
): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
  // Scores are inverted: higher score = more difficult. Level boundaries are based on this.
  if (overallScore <= 30) return 'beginner' // Very easy to read
  if (overallScore <= 55) return 'intermediate' // Average difficulty
  if (overallScore <= 75) return 'advanced' // Fairly difficult
  return 'expert' // Very difficult
}

function calculateOverallScore(fleschKincaid: number, gunningFog: number): number {
  // Normalize scores to a 0-100 scale where higher is more difficult
  const normalizedFK = Math.max(0, 100 - fleschKincaid) // Higher FK is easier, so we invert it.
  const normalizedGF = Math.min(100, (gunningFog / 25) * 100) // Gunning Fog is open-ended, cap at a reasonable level (e.g., 25).

  // Note: lexicalDensity is currently a placeholder (0), so its weight is 0.
  const overall = normalizedFK * 0.5 + normalizedGF * 0.5
  return Math.round(overall)
}

// The LanguageDetector interface, for dependency injection
interface ILanguageDetector {
  detectLanguage(text: string): Promise<string | null>
}

export async function estimateTextDifficulty(
  text: string,
  targetLanguage?: string,
  languageDetector: ILanguageDetector = new LanguageDetector()
): Promise<DifficultyResult | null> {
  // Determine the language to use for analysis.
  const detectedLanguage = targetLanguage || (await languageDetector.detectLanguage(text))

  if (!detectedLanguage || !SUPPORTED_LANGUAGES.has(detectedLanguage)) {
    if (detectedLanguage) {
      console.warn(`Language "${detectedLanguage}" is not supported for difficulty estimation.`)
    }
    return null
  }

  const language = detectedLanguage as 'eng' | 'fra' | 'spa' | 'deu' | 'ita'

  // Use the new multi-language analysis function
  const stats = await analyzeText(text, language)

  if (stats.wordCount === 0) {
    return null
  }

  const { fleschKincaid, gunningFogIndex, wordCount, sentenceCount, longWordCount } = stats
  let overallScore: number

  if (language === 'eng') {
    // For English, syllable-based scores are reliable.
    overallScore = calculateOverallScore(fleschKincaid, gunningFogIndex)
  } else {
    // For other languages, use a two-factor model based on sentence length and word length,
    // as syllable counting is unreliable.
    const wordsPerSentence = wordCount > 0 ? wordCount / sentenceCount : 0
    const longWordPercentage = wordCount > 0 ? (longWordCount / wordCount) * 100 : 0

    // Combine scores from sentence length and word complexity.
    // Normalize each factor and then weight them.
    const scoreFromSentenceLength = Math.min(100, (wordsPerSentence / 25) * 100)
    const scoreFromWordComplexity = Math.min(100, (longWordPercentage / 40) * 100) // Assume 40% long words is high

    overallScore = scoreFromSentenceLength * 0.5 + scoreFromWordComplexity * 0.5
  }

  const level = getDifficultyLevel(overallScore)
  const lexicalDensity = 0 // Placeholder, as it's not provided by retext-readability yet

  const result: DifficultyResult = {
    language: language,
    generalLevel: {
      fleschKincaid: parseFloat(fleschKincaid.toFixed(2)),
      gunningFogIndex: parseFloat(gunningFogIndex.toFixed(2)),
      lexicalDensity: parseFloat(lexicalDensity.toFixed(2)),
      overallScore: overallScore,
      level: level
    },
    textStats: {
      wordCount: stats.wordCount,
      sentenceCount: stats.sentenceCount,
      syllableCount: stats.syllableCount,
      complexWords: stats.complexWords,
      longWordCount: stats.longWordCount
    }
  }

  console.log('Difficulty Analysis:', {
    text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
    language: result.language,
    fleschKincaid: result.generalLevel.fleschKincaid,
    gunningFog: result.generalLevel.gunningFogIndex,
    lexicalDensity: result.generalLevel.lexicalDensity,
    level: result.generalLevel.level,
    stats: result.textStats
  })

  return result
}
