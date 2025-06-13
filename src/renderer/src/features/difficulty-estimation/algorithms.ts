import { unified, Plugin } from 'unified'
import retextEnglish from 'retext-english'
import retextLatin from 'retext-latin'
import retextStringify from 'retext-stringify'
import { visit } from 'unist-util-visit'
import { toString } from 'nlcst-to-string'
import { syllable } from 'syllable'
import { VFile } from 'vfile'
import { Node } from 'unist'

import { TextAnalysisResult } from './types.js'

// Custom unified plugin to perform text analysis
const textStatisticsPlugin: Plugin = function () {
  return (tree: Node, file: VFile & { data: { statistics?: TextAnalysisResult } }) => {
    let sentenceCount = 0
    let wordCount = 0
    let syllableCount = 0
    let complexWords = 0
    let longWordCount = 0

    // Count words and syllables first, as they are more reliable across parsers.
    visit(tree, 'WordNode', (node) => {
      wordCount++
      const word = toString(node)
      const syllables = syllable(word)
      syllableCount += syllables
      if (syllables >= 3) {
        complexWords++
      }
      // A simple metric for word complexity based on length, useful for non-English text.
      if (word.length >= 8) {
        longWordCount++
      }
    })

    // Count sentences using the parser's nodes.
    visit(tree, 'SentenceNode', () => {
      sentenceCount++
    })

    // If sentence count seems wrong (e.g., for non-English), use a fallback.
    if (sentenceCount <= 1 && wordCount > 0) {
      let manualSentenceCount = 0
      visit(tree, 'PunctuationNode', (node) => {
        if (/[.!?]/.test(toString(node))) {
          manualSentenceCount++
        }
      })
      // If we found punctuation, use that. Otherwise, assume 1 sentence.
      sentenceCount = manualSentenceCount > 0 ? manualSentenceCount : 1
    }

    // Avoid division by zero errors for empty or very short texts
    if (wordCount === 0 || sentenceCount === 0) {
      file.data.statistics = {
        fleschKincaid: 0,
        gunningFogIndex: 0,
        wordCount,
        sentenceCount,
        syllableCount,
        complexWords,
        longWordCount: 0,
        lexicalDensity: 0
      }
      return
    }

    // Flesch-Kincaid Reading Ease formula
    const fleschKincaid = Math.max(
      0,
      206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount)
    )

    // Gunning Fog Index formula
    const gunningFogIndex = 0.4 * (wordCount / sentenceCount + 100 * (complexWords / wordCount))

    file.data.statistics = {
      fleschKincaid: fleschKincaid,
      gunningFogIndex: gunningFogIndex,
      wordCount: wordCount,
      sentenceCount: sentenceCount,
      syllableCount: syllableCount,
      complexWords: complexWords,
      longWordCount: longWordCount,
      lexicalDensity: 0 // Placeholder
    }
  }
}

export async function analyzeText(
  text: string,
  language: 'eng' | 'fra' | 'spa' | 'deu' | 'ita'
): Promise<TextAnalysisResult> {
  // Handle empty or whitespace-only strings gracefully
  if (!text.trim()) {
    return {
      fleschKincaid: 0,
      gunningFogIndex: 0,
      wordCount: 0,
      sentenceCount: 0,
      syllableCount: 0,
      complexWords: 0,
      longWordCount: 0,
      lexicalDensity: 0
    }
  }

  // Select the appropriate parser based on the language
  const parser = language === 'eng' ? retextEnglish : retextLatin

  // Process the text using the unified pipeline with our custom plugin
  const file = await unified()
    .use(parser)
    .use(textStatisticsPlugin) // Use our custom plugin
    .use(retextStringify)
    .process(text)

  // Extract the results from the vfile.data object
  return file.data.statistics as TextAnalysisResult
}
