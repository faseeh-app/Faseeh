import { describe, it } from 'node:test'
import assert from 'node:assert'
import { estimateTextDifficulty } from '../difficultyEstimator.js'

// Test cases with updated expectations for multi-language analysis
const englishTestCases = [
  {
    name: "Simple Children's Text",
    text: 'The cat is big. The dog is small. They play in the yard.',
    expectedLevel: 'beginner',
    expectedLanguage: 'eng'
  },
  {
    name: 'Academic Text',
    text: 'The implementation of machine learning algorithms in natural language processing requires sophisticated computational frameworks and extensive preprocessing methodologies.',
    expectedLevel: 'expert',
    expectedLanguage: 'eng'
  },
  {
    name: 'News Article Style',
    text: 'Recent studies on climate change indicate a significant increase in global temperatures, prompting international policy reviews and technological innovation.',
    expectedLevel: 'expert',
    expectedLanguage: 'eng'
  },
  {
    name: 'Technical Documentation',
    text: 'Configure the authentication middleware by implementing the validateToken function. This function should verify JWT tokens and handle authorization errors appropriately.',
    expectedLevel: 'expert',
    expectedLanguage: 'eng'
  },
  {
    name: 'Conversational Text',
    text: "Hey! How are you doing today? I'm great, thanks for asking. Want to grab lunch later?",
    expectedLevel: 'beginner',
    expectedLanguage: 'eng'
  }
]

const frenchTestCases = [
  {
    name: 'Simple French Text',
    text: 'Le chat mange du poisson. Il est très content. Sa mère le regarde avec fierté.',
    expectedLevel: 'beginner',
    expectedLanguage: 'fra'
  },
  {
    name: 'French Literature',
    text: "L'implémentation des algorithmes d'apprentissage automatique nécessite une compréhension approfondie des méthodologies computationnelles et des frameworks sophistiqués.",
    expectedLevel: 'expert', // Updated expectation
    expectedLanguage: 'fra'
  },
  {
    name: 'French News',
    text: 'Le gouvernement français a annoncé hier de nouvelles mesures économiques. Ces décisions concernent directement les entreprises et les citoyens.',
    expectedLevel: 'advanced', // Updated expectation
    expectedLanguage: 'fra'
  }
]

const spanishTestCases = [
  {
    name: 'Simple Spanish Text',
    text: 'El perro corre en el parque. Los niños juegan con la pelota. Es un día muy bonito.',
    expectedLevel: 'beginner',
    expectedLanguage: 'spa'
  },
  {
    name: 'Spanish Academic',
    text: 'La implementación de metodologías pedagógicas innovadoras requiere una evaluación exhaustiva de los paradigmas educativos contemporáneos.',
    expectedLevel: 'expert', // Updated expectation
    expectedLanguage: 'spa'
  },
  {
    name: 'Spanish Journalism',
    text: 'Los investigadores han descubierto nuevos métodos para analizar grandes volúmenes de datos. Esto podría revolucionar varios campos científicos.',
    expectedLevel: 'advanced', // Updated expectation
    expectedLanguage: 'spa'
  }
]

const germanTestCases = [
  {
    name: 'Simple German Text',
    text: 'Der Hund läuft schnell. Die Katze schläft auf dem Sofa. Das Wetter ist heute schön.',
    expectedLevel: 'beginner',
    expectedLanguage: 'deu'
  },
  {
    name: 'German Technical',
    text: 'Die Implementierung fortschrittlicher Algorithmen erfordert tiefgreifende Kenntnisse der Informatik und mathematischen Grundlagen.',
    expectedLevel: 'advanced', // Updated expectation
    expectedLanguage: 'deu'
  }
]

const italianTestCases = [
  {
    name: 'Simple Italian Text',
    text: 'La pizza è molto buona. I bambini mangiano il gelato. Oggi fa bel tempo in Italia.',
    expectedLevel: 'beginner',
    expectedLanguage: 'ita'
  },
  {
    name: 'Italian Academic',
    text: "L'implementazione di sistemi computazionali avanzati richiede competenze specifiche nell'ambito dell'ingegneria informatica e delle metodologie algoritmiche.",
    expectedLevel: 'expert', // Updated expectation
    expectedLanguage: 'ita'
  }
]

describe('Difficulty Estimation Integration Tests', () => {
  const allTestCases = [
    ...englishTestCases,
    ...frenchTestCases,
    ...spanishTestCases,
    ...germanTestCases,
    ...italianTestCases
  ]

  allTestCases.forEach((testCase) => {
    it(`should correctly process text for: ${testCase.name}`, async () => {
      const result = await estimateTextDifficulty(testCase.text)
      // The language detector may not be perfect, so we accept its result if it's supported.
      if (!result) {
        assert.fail(`Result should not be null for test case: ${testCase.name}`)
      }

      assert.strictEqual(
        result.language,
        testCase.expectedLanguage,
        `Expected language ${testCase.expectedLanguage} but got ${result.language} for: ${testCase.name}`
      )
      assert.strictEqual(
        result.generalLevel.level,
        testCase.expectedLevel,
        `Expected level ${testCase.expectedLevel} but got ${result.generalLevel.level} for: ${testCase.name}`
      )
    })
  })

  it('should return null for empty text', async () => {
    const result = await estimateTextDifficulty('')
    assert.strictEqual(result, null)
  })
})


