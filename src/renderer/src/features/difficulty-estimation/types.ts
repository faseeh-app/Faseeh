export interface TextAnalysisResult {
  fleschKincaid: number
  gunningFogIndex: number
  wordCount: number
  sentenceCount: number
  syllableCount: number
  complexWords: number
  longWordCount: number
  lexicalDensity: number
}

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
    longWordCount: number
  }
}
