// A simple syllable counter. This is a heuristic and may not be 100% accurate.
function countSyllables(word: string): number {
  word = word.toLowerCase().trim()
  if (word.length <= 3) return 1

  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
  word = word.replace(/^y/, '')

  const matches = word.match(/[aeiouy]{1,2}/g)
  return matches ? matches.length : 1
}

// A simple list of English function words for lexical density calculation.
const functionWords = new Set([
  'a',
  'an',
  'the',
  'and',
  'but',
  'or',
  'so',
  'for',
  'nor',
  'yet',
  'in',
  'on',
  'at',
  'to',
  'from',
  'by',
  'with',
  'about',
  'of',
  'i',
  'you',
  'he',
  'she',
  'it',
  'we',
  'they',
  'me',
  'him',
  'her',
  'us',
  'them',
  'my',
  'your',
  'his',
  'its',
  'our',
  'their',
  'mine',
  'yours',
  'hers',
  'ours',
  'theirs',
  'is',
  'am',
  'are',
  'was',
  'were',
  'be',
  'being',
  'been',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'shall',
  'should',
  'can',
  'could',
  'may',
  'might',
  'must',
  'that',
  'which',
  'who',
  'what',
  'when',
  'where',
  'why',
  'how'
])

export function analyzeText(text: string): {
  wordCount: number
  sentenceCount: number
  syllableCount: number
  complexWords: number
  contentWords: number
} {
  const words = text.match(/\b\w+\b/g) || []
  const wordCount = words.length
  const sentenceCount = (text.match(/[.!?]+/g) || []).length || 1

  let syllableCount = 0
  let complexWords = 0
  let contentWords = 0

  for (const word of words) {
    const syllables = countSyllables(word)
    syllableCount += syllables
    if (syllables >= 3) {
      complexWords++
    }
    if (!functionWords.has(word.toLowerCase())) {
      contentWords++
    }
  }

  return {
    wordCount,
    sentenceCount,
    syllableCount,
    complexWords,
    contentWords
  }
}

export function calculateFleschKincaid(stats: {
  wordCount: number
  sentenceCount: number
  syllableCount: number
}): number {
  if (stats.wordCount === 0 || stats.sentenceCount === 0) return 0
  const asl = stats.wordCount / stats.sentenceCount
  const asw = stats.syllableCount / stats.wordCount
  return 206.835 - 1.015 * asl - 84.6 * asw
}

export function calculateGunningFog(stats: {
  wordCount: number
  sentenceCount: number
  complexWords: number
}): number {
  if (stats.wordCount === 0 || stats.sentenceCount === 0) return 0
  const asl = stats.wordCount / stats.sentenceCount
  const psw = (stats.complexWords / stats.wordCount) * 100
  return 0.4 * (asl + psw)
}

export function calculateLexicalDensity(stats: {
  wordCount: number
  contentWords: number
}): number {
  if (stats.wordCount === 0) return 0
  return (stats.contentWords / stats.wordCount) * 100
}
