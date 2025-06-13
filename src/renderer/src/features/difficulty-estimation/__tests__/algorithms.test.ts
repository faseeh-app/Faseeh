import { describe, it } from 'node:test'
import assert from 'node:assert'
import { analyzeText } from '../algorithms.js'

describe('Multi-language Text Analysis (analyzeText)', () => {
  // Helper to check if a value is a number and not NaN
  const assertIsNumber = (value: unknown, name: string) => {
    assert.strictEqual(typeof value, 'number', `${name} should be a number, but got ${typeof value}`)
    assert.ok(!isNaN(value as number), `${name} should not be NaN`)
  }

  it('should correctly analyze a simple English sentence', async () => {
    const text = 'The cat sat on the mat. It was a nice day.'
    const stats = await analyzeText(text, 'eng')

    assert.strictEqual(stats.wordCount, 11, 'English word count should be correct')
    assert.strictEqual(stats.sentenceCount, 2, 'English sentence count should be correct')
    assertIsNumber(stats.fleschKincaid, 'English Flesch-Kincaid')
    assertIsNumber(stats.gunningFogIndex, 'English Gunning Fog')
    assert.ok(
      stats.fleschKincaid > 50,
      'Simple English text should have a high Flesch-Kincaid score (easy to read)'
    )
  })

  it('should correctly analyze a simple French sentence', async () => {
    const text = 'Le chat est assis sur le tapis. Il faisait beau.'
    const stats = await analyzeText(text, 'fra')

    assert.strictEqual(stats.wordCount, 10, 'French word count should be correct')
    assert.strictEqual(stats.sentenceCount, 2, 'French sentence count should be correct')
    assertIsNumber(stats.fleschKincaid, 'French Flesch-Kincaid')
    assertIsNumber(stats.gunningFogIndex, 'French Gunning Fog')
    assert.ok(
      stats.fleschKincaid > 50,
      'Simple French text should have a high Flesch-Kincaid score'
    )
  })

  it('should correctly analyze a complex German sentence', async () => {
    const text =
      'Die Durchführung komplexer Analysen erfordert fortschrittliche computerlinguistische Methoden.'
    const stats = await analyzeText(text, 'deu')

    assert.strictEqual(stats.wordCount, 8, 'German word count should be correct')
    assert.strictEqual(stats.sentenceCount, 1, 'German sentence count should be correct')
    assertIsNumber(stats.fleschKincaid, 'German Flesch-Kincaid')
    assertIsNumber(stats.gunningFogIndex, 'German Gunning Fog')
    assert.strictEqual(stats.complexWords, 7, 'German complex word count should be correct')
    assert.ok(
      stats.gunningFogIndex > 10,
      'Complex German text should have a high Gunning Fog score (hard to read)'
    )
  })

  it('should handle an empty string gracefully', async () => {
    const stats = await analyzeText('', 'eng')
    assert.strictEqual(stats.wordCount, 0)
    assert.strictEqual(stats.sentenceCount, 0)
    assert.strictEqual(stats.fleschKincaid, 0)
    assert.strictEqual(stats.gunningFogIndex, 0)
  })
})
