import { describe, it, before, beforeEach, after, mock } from 'node:test'
import assert from 'node:assert'
import { estimateTextDifficulty } from '../difficultyEstimator.ts'

// Helper for floating point comparisons
const expectToBeCloseTo = (actual, expected, precision = 2) => {
  const pass = Math.abs(expected - actual) < Math.pow(10, -precision) / 2
  if (!pass) {
    assert.fail(`Expected ${actual} to be close to ${expected} with precision ${precision}`)
  }
}

describe('estimateTextDifficulty', () => {
  let consoleWarnSpy
  let mockLanguageDetector

  before(() => {
    // Spy on console.warn to check for specific warnings
    consoleWarnSpy = mock.method(console, 'warn', () => {})
  })

  beforeEach(() => {
    // Reset spies and mocks for each test
    consoleWarnSpy.mock.resetCalls()
    mockLanguageDetector = {
      detectLanguage: mock.fn(async (_text: string) => 'eng')
    }
  })

  after(() => {
    // Restore the original console.warn
    consoleWarnSpy.mock.restore()
  })

  it('should return null for unsupported languages when detected automatically', async () => {
    const text = 'La casa es grande.'
    mockLanguageDetector.detectLanguage.mock.mockImplementationOnce(async () => 'spa')

    const result = await estimateTextDifficulty(text, undefined, mockLanguageDetector)

    assert.strictEqual(result, null)
    assert.strictEqual(consoleWarnSpy.mock.callCount(), 1)
    assert.strictEqual(
      consoleWarnSpy.mock.calls[0].arguments[0],
      `Language "spa" is not supported for difficulty estimation. Only 'eng' is supported.`
    )
    assert.strictEqual(mockLanguageDetector.detectLanguage.mock.callCount(), 1)
  })

  it('should return null for unsupported languages when passed as targetLanguage', async () => {
    const text = 'This is a test.'
    const result = await estimateTextDifficulty(text, 'spa', mockLanguageDetector)

    assert.strictEqual(result, null)
    assert.strictEqual(mockLanguageDetector.detectLanguage.mock.callCount(), 0)
    assert.strictEqual(consoleWarnSpy.mock.callCount(), 1)
    assert.strictEqual(
      consoleWarnSpy.mock.calls[0].arguments[0],
      `Language "spa" is not supported for difficulty estimation. Only 'eng' is supported.`
    )
  })

  it('should return null for empty text', async () => {
    const result = await estimateTextDifficulty('', undefined, mockLanguageDetector)
    assert.strictEqual(result, null)
  })

  it('should correctly analyze a simple English text', async () => {
    const text = 'The cat sat on the mat.'
    const result = await estimateTextDifficulty(text, undefined, mockLanguageDetector)

    assert.notStrictEqual(result, null)
    if (!result) return // Type guard

    assert.strictEqual(result.language, 'eng')
    assert.strictEqual(result.generalLevel.level, 'beginner')
    expectToBeCloseTo(result.generalLevel.fleschKincaid, 116.15)
    assert.strictEqual(mockLanguageDetector.detectLanguage.mock.callCount(), 1)
  })

  it('should correctly analyze a complex English text using targetLanguage', async () => {
    const text = 'The implementation of sophisticated algorithms requires comprehensive understanding.'
    const result = await estimateTextDifficulty(text, 'eng', mockLanguageDetector)

    assert.strictEqual(mockLanguageDetector.detectLanguage.mock.callCount(), 0)
    assert.notStrictEqual(result, null)
    if (!result) return

    assert.strictEqual(result.language, 'eng')
    assert.strictEqual(result.generalLevel.level, 'expert')
    expectToBeCloseTo(result.generalLevel.gunningFogIndex, 28.2)
  })
})

