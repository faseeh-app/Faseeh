import { LanguageDetector } from '../../core/services/language-detection/language-detector.js'
import {
  analyzeText,
  calculateFleschKincaid,
  calculateGunningFog,
  calculateLexicalDensity
} from './algorithms.js'
import { DifficultyResult } from './types.js'

function getDifficultyLevel(
  overallScore: number
): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
  if (overallScore <= 30) return 'beginner'
  if (overallScore <= 55) return 'intermediate'
  if (overallScore <= 75) return 'advanced'
  return 'expert'
}

function calculateOverallScore(
  fleschKincaid: number,
  gunningFog: number,
  lexicalDensity: number
): number {
  // Normalize scores to a 0-100 scale where higher is more difficult
  const normalizedFK = Math.max(0, 100 - fleschKincaid) // Higher FK is easier, so we invert it.
  const normalizedGF = Math.min(100, (gunningFog / 20) * 100) // Gunning Fog is open-ended, cap at a reasonable level (e.g., 20).
  const normalizedLD = lexicalDensity // Lexical density is already a percentage.

  // Weighted average. We can tweak these weights later.
  const overall = normalizedFK * 0.4 + normalizedGF * 0.4 + normalizedLD * 0.2
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
  // Determine the language to use for analysis. Prioritize the explicitly provided targetLanguage.
  const language = targetLanguage || (await languageDetector.detectLanguage(text))

  // For now, we only support English ('eng').
  if (language !== 'eng') {
    console.warn(
      `Language "${language}" is not supported for difficulty estimation. Only 'eng' is supported.`
    )
    return null
  }

  const stats = analyzeText(text)
  if (stats.wordCount === 0) {
    return null
  }

  const fleschKincaid = calculateFleschKincaid(stats)
  const gunningFogIndex = calculateGunningFog(stats)
  const lexicalDensity = calculateLexicalDensity(stats)
  const overallScore = calculateOverallScore(fleschKincaid, gunningFogIndex, lexicalDensity)
  const level = getDifficultyLevel(overallScore)

  const result: DifficultyResult = {
    language: 'eng',
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
      complexWords: stats.complexWords
    }
  }

  console.log('Difficulty Analysis:', {
    text: text.substring(0, 50) + '...',
    language: result.language,
    fleschKincaid: result.generalLevel.fleschKincaid,
    gunningFog: result.generalLevel.gunningFogIndex,
    lexicalDensity: result.generalLevel.lexicalDensity,
    level: result.generalLevel.level,
    stats: result.textStats
  })

  return result
}
