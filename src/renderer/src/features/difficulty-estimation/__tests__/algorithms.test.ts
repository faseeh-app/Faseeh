import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  analyzeText,
  calculateFleschKincaid,
  calculateGunningFog,
  calculateLexicalDensity
} from '../algorithms.ts'

describe('Difficulty Estimation Algorithms', () => {
  const expectToBeCloseTo = (actual, expected, precision = 2) => {
    const pass = Math.abs(expected - actual) < Math.pow(10, -precision) / 2
    if (!pass) {
      assert.fail(`Expected ${actual} to be close to ${expected}`)
    }
  }

  describe('analyzeText', () => {
    it('should correctly analyze an empty string', () => {
      const stats = analyzeText('')
      assert.deepStrictEqual(stats, {
        wordCount: 0,
        sentenceCount: 1, // Default to 1 to avoid division by zero
        syllableCount: 0,
        complexWords: 0,
        contentWords: 0
      })
    })

    it('should correctly analyze a simple sentence', () => {
      const text = 'The cat sat on the mat.'
      const stats = analyzeText(text)
      assert.strictEqual(stats.wordCount, 6)
      assert.strictEqual(stats.sentenceCount, 1)
      assert.strictEqual(stats.syllableCount, 6)
      assert.strictEqual(stats.complexWords, 0)
      assert.strictEqual(stats.contentWords, 3) // cat, sat, mat
    })

    it('should correctly analyze a sentence with complex words', () => {
      const text = 'The implementation of sophisticated algorithms requires comprehensive understanding.'
      const stats = analyzeText(text)
      assert.strictEqual(stats.wordCount, 8)
      assert.strictEqual(stats.sentenceCount, 1)
      assert.strictEqual(stats.complexWords, 5) // implementation, sophisticated, algorithms, comprehensive, understanding
      assert.strictEqual(stats.contentWords, 6)
    })
  })

  describe('calculateFleschKincaid', () => {
    it('should return 0 for empty stats', () => {
      const score = calculateFleschKincaid({ wordCount: 0, sentenceCount: 0, syllableCount: 0 })
      assert.strictEqual(score, 0)
    })

    it('should calculate the correct score for simple text', () => {
      const stats = { wordCount: 6, sentenceCount: 1, syllableCount: 6 }
      const score = calculateFleschKincaid(stats)
      expectToBeCloseTo(score, 116.145, 3)
    })
  })

  describe('calculateGunningFog', () => {
    it('should return 0 for empty stats', () => {
      const score = calculateGunningFog({ wordCount: 0, sentenceCount: 0, complexWords: 0 })
      assert.strictEqual(score, 0)
    })

    it('should calculate the correct score for complex text', () => {
      const stats = { wordCount: 8, sentenceCount: 1, complexWords: 5 }
      const score = calculateGunningFog(stats)
      expectToBeCloseTo(score, 28.2, 1)
    })
  })

  describe('calculateLexicalDensity', () => {
    it('should return 0 for empty stats', () => {
      const score = calculateLexicalDensity({ wordCount: 0, contentWords: 0 })
      assert.strictEqual(score, 0)
    })

    it('should calculate the correct density for a simple sentence', () => {
      const stats = { wordCount: 6, contentWords: 3 }
      const score = calculateLexicalDensity(stats)
      assert.strictEqual(score, 50)
    })
  })
})
