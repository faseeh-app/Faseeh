export interface DifficultyResult {
  language: string
  generalLevel: {
    fleschKincaid: number
    gunningFogIndex: number
    lexicalDensity: number
    overallScore: number
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  }
  textStats: {
    wordCount: number
    sentenceCount: number
    syllableCount: number
    complexWords: number
  }
}
