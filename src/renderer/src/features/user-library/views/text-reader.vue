<script setup lang="ts">
import { computed, onMounted, ref, watch, shallowRef, nextTick, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import type { ContentDocument, ContentBlock, TextBlock } from '@shared/types/types'
import type { Token } from '@shared/types/text-tokenizer-types'
import { storage, faseehApp } from '@renderer/core/services/service-container'
import { tokenizerRegistry } from '@renderer/core/services/tokenization/text-tokenizer-registry'
import { initializeDefaultTokenizers } from '@renderer/core/services/tokenization/tokenizers/default-tokenizers'
import ContentBlockRenderer from '@renderer/features/user-library/components/ContentBlockRenderer.vue'

const langs = require('langs')
const route = useRoute()
const documentId = computed(() => route.params.id as string)

// Data - use shallowRef for large data structures to improve performance
const document = ref<ContentDocument | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const tokenizedBlocks = shallowRef<Map<string, Token[]>>(new Map()) // Use shallowRef for performance
const convertedLanguageCache = ref<string | null>(null)

// Performance: Debounced rendering during resize events
const isResizing = ref(false)
let resizeTimeoutId: number | null = null

// Stable tokens reference to prevent unnecessary re-renders
const stableTokenizedBlocks = computed(() => tokenizedBlocks.value)

// Performance: Only render blocks when not actively resizing
const shouldRenderBlocks = computed(() => !isResizing.value)

// Handle window resize events
function handleResize() {
  isResizing.value = true

  if (resizeTimeoutId) {
    clearTimeout(resizeTimeoutId)
  }

  resizeTimeoutId = window.setTimeout(() => {
    isResizing.value = false
    resizeTimeoutId = null
  }, 150) // 150ms debounce
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (resizeTimeoutId) {
    clearTimeout(resizeTimeoutId)
  }
})

/**
 * Convert ISO 639-3 language code to ISO 639-1 format
 * Falls back to the original code if no mapping is found
 */
function convertLanguageCode(iso639_3: string): string {
  const info = langs.where('3', iso639_3)
  console.log('Converting language code:', iso639_3, '->', info ? info['1'] : iso639_3)
  return info ? info['1'] : iso639_3
}

// Initialize tokenizers
function ensureTokenizerInitialized() {
  const registeredTokenizers = tokenizerRegistry.listRegisteredTokenizers()
  if (registeredTokenizers.length === 0) {
    try {
      initializeDefaultTokenizers(tokenizerRegistry)
    } catch (error) {
      console.warn('Failed to initialize tokenizers:', error)
    }
  }
}

// Load document
async function loadDocument() {
  if (!documentId.value) return

  try {
    loading.value = true
    error.value = null

    const doc = await storage().getDocumentJson(documentId.value)
    if (!doc) {
      error.value = 'Document not found'
      return
    }
    document.value = doc

    await detectDocumentLanguage()

    await tokenizeAllTextBlocks()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load document'
  } finally {
    loading.value = false
  }
}

// Detect document language from content
async function detectDocumentLanguage() {
  if (!document.value) return

  try {
    const textBlocks = extractTextBlocks(document.value.contentBlocks)
    const sampleText = textBlocks
      .slice(0, 3)
      .map((block) => block.content)
      .join(' ')
      .trim()

    if (sampleText.length > 10) {
      const app = faseehApp()
      const detectedLanguage = await app.languageDetector.detectLanguage(sampleText)
      if (detectedLanguage) {
        document.value.metadata.language = detectedLanguage
      }
    }
  } catch (error) {
    console.error('Language detection failed:', error)
  }
}

// Tokenize all text blocks in the document
async function tokenizeAllTextBlocks() {
  if (!document.value) return

  ensureTokenizerInitialized()

  // Convert the document language once and cache it
  const documentLanguage = document.value.metadata.language || '*'
  convertedLanguageCache.value = convertLanguageCode(documentLanguage)
  console.log(
    'Document language converted once:',
    documentLanguage,
    '->',
    convertedLanguageCache.value
  )

  const textBlocks = extractTextBlocks(document.value.contentBlocks)

  // Create a new Map to avoid triggering reactivity on each block update
  const newTokenizedBlocks = new Map<string, Token[]>()
  // Process blocks in batches to avoid blocking the UI
  const batchSize = 5
  for (let i = 0; i < textBlocks.length; i += batchSize) {
    const batch = textBlocks.slice(i, i + batchSize)

    await Promise.all(
      batch.map(async (block) => {
        await tokenizeTextBlock(block)
      })
    )

    // Allow UI to update between batches
    await nextTick()
  }
}

// Extract all text blocks from content blocks (including nested ones)
function extractTextBlocks(blocks: ContentBlock[]): TextBlock[] {
  const textBlocks: TextBlock[] = []

  for (const block of blocks) {
    if (block.type === 'text') {
      textBlocks.push(block)
    } else if (block.type === 'container') {
      textBlocks.push(...extractTextBlocks(block.children))
    } else if (block.type === 'annotatedImage') {
      // Extract text from annotations
      for (const annotation of block.annotations) {
        const textBlock: TextBlock = {
          id: `${block.id}-annotation-${annotation.id}`,
          type: 'text',
          content: annotation.text,
          order: annotation.order,
          language: annotation.language
        }
        textBlocks.push(textBlock)
      }
    }
  }

  return textBlocks
}

// Tokenize a single text block
async function tokenizeTextBlock(block: TextBlock) {
  if (!block.content?.trim()) return

  try {
    // Use block-specific language if available, otherwise use cached converted document language
    let language: string
    if (block.language && block.language !== document.value?.metadata.language) {
      // Block has its own language, convert it
      language = convertLanguageCode(block.language)
      console.log(`Block ${block.id} has specific language:`, block.language, '->', language)
    } else {
      // Use cached document language
      language = convertedLanguageCache.value || '*'
    }

    const tokens = await tokenizerRegistry.tokenizeText(block.content, language)
    tokenizedBlocks.value.set(block.id, tokens)
  } catch (error) {
    console.error(`Failed to tokenize block ${block.id}:`, error)
    const words = block.content.trim().split(/\s+/)
    const fallbackTokens: Token[] = words.map((word, index) => ({
      text: word,
      startIndex: index,
      endIndex: index,
      isWord: /\w/.test(word)
    }))
    tokenizedBlocks.value.set(block.id, fallbackTokens)
  }
}

// Handle token click
function handleTokenClick(token: Token, block: TextBlock) {
  console.log('Token clicked:', token, 'in block:', block.id)
}

function getAssetUrl(assetId: string): string {
  return `asset://${assetId}`
}

onMounted(loadDocument)
watch(documentId, loadDocument)
</script>

<template>
  <div class="faseeh-text-reader">
    <div v-if="loading" class="faseeh-text-reader__loading">Loading...</div>
    <div v-else-if="error" class="faseeh-text-reader__error">Error: {{ error }}</div>
    <div v-else-if="document" class="faseeh-text-reader__content">
      <!-- Show a lightweight placeholder during resize for performance -->
      <div v-if="isResizing" class="resize-placeholder">
        <div class="resize-placeholder__text">Adjusting layout...</div>
      </div>
      <!-- Render full content when not resizing -->
      <template v-else>
        <ContentBlockRenderer
          v-for="block in document.contentBlocks"
          :key="`block-${block.id}-${block.order}`"
          :block="block"
          :tokens="stableTokenizedBlocks"
          :is-tokenizing="new Set()"
          @token-click="handleTokenClick"
          @asset-url="getAssetUrl"
        />
      </template>
    </div>
  </div>
</template>
