<script setup lang="ts">
import { ref, watch } from 'vue'
import type {
  SubtitleCue,
  SubtitleWord
} from '@renderer/features/user-library/composables/useVideoPlayer'
import { tokenizerRegistry } from '@renderer/core/services/tokenization/text-tokenizer-registry'
import { initializeDefaultTokenizers } from '@renderer/core/services/tokenization/tokenizers/default-tokenizers'
import type { Token } from '@shared/types/text-tokenizer-types'

interface Props {
  currentCue: SubtitleCue | null
  visible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: true
})

interface Emits {
  wordClick: [word: SubtitleWord, cue: SubtitleCue]
  tokenClick: [token: Token, cue: SubtitleCue]
}

const emit = defineEmits<Emits>()

// Initialize tokenizers if not already done
function ensureTokenizerInitialized() {
  // Check if tokenizers are already registered
  const registeredTokenizers = tokenizerRegistry.listRegisteredTokenizers()
  if (registeredTokenizers.length === 0) {
    try {
      initializeDefaultTokenizers(tokenizerRegistry)
    } catch (error) {
      console.warn('Failed to initialize tokenizers:', error)
    }
  }
}

// Reactive tokens for sentence-level cues
const tokens = ref<Token[]>([])
const isTokenizing = ref(false)

// Watch for changes in current cue to tokenize text
watch(
  () => props.currentCue,
  async (newCue) => {
    tokens.value = []

    if (!newCue || (newCue.words && newCue.words.length > 0)) {
      // Skip tokenization if we have word-level data
      return
    }

    if (newCue.text && newCue.text.trim()) {
      isTokenizing.value = true
      try {
        ensureTokenizerInitialized()
        const result = await tokenizerRegistry.tokenizeText(newCue.text, '*')
        tokens.value = result
      } catch (error) {
        console.error('Failed to tokenize subtitle text:', error)
        // Fallback: create basic tokens by splitting on whitespace
        const words = newCue.text.trim().split(/\s+/)
        tokens.value = words.map((word, index) => ({
          text: word,
          startIndex: index,
          endIndex: index,
          isWord: /\w/.test(word)
        }))
      } finally {
        isTokenizing.value = false
      }
    }
  },
  { immediate: true }
)

function handleWordClick(word: SubtitleWord) {
  if (props.currentCue) {
    emit('wordClick', word, props.currentCue)
  }
}

function handleTokenClick(token: Token) {
  if (props.currentCue) {
    emit('tokenClick', token, props.currentCue)
  }
}
</script>

<template>
  <div
    v-if="visible && currentCue"
    class="absolute bottom-16 left-0 right-0 z-10 pointer-events-none"
  >
    <div class="subtitle-container mx-auto max-w-4xl px-4 pointer-events-auto">
      <div class="subtitle-text bg-black/80 text-white p-3 rounded-lg text-center backdrop-blur-sm">
        <!-- Word-level subtitles (for transcripts with word timing) -->
        <template v-if="currentCue.words && currentCue.words.length > 0">
          <span
            v-for="word in currentCue.words"
            :key="word.id"
            :class="[
              'subtitle-word inline-block mx-1 px-1 py-0.5 rounded cursor-pointer transition-all duration-200',
              'hover:bg-blue-500/50 hover:scale-105 active:scale-95',
              word.confidence && word.confidence < 0.7 ? 'text-yellow-300' : 'text-white'
            ]"
            :title="`Confidence: ${word.confidence ? Math.round(word.confidence * 100) : 100}%`"
            @click="handleWordClick(word)"
          >
            {{ word.text }}
          </span>
        </template>
        <!-- Sentence-level subtitles (for SRT/VTT/JSON cues without word timing) -->
        <template v-else>
          <!-- Show tokenized interactive words if available -->
          <template v-if="tokens.length > 0">
            <span
              v-for="(token, index) in tokens"
              :key="`token-${index}`"
              :class="[
                'subtitle-token inline-block mx-0.5 px-1 py-0.5 rounded cursor-pointer transition-all duration-200',
                'hover:bg-blue-500/50 hover:scale-105 active:scale-95',
                token.isWord ? 'text-white' : 'text-gray-300'
              ]"
              :title="`Token: ${token.text} (${token.isWord ? 'word' : 'punctuation'})`"
              @click="handleTokenClick(token)"
            >
              {{ token.text }}
            </span>
          </template>

          <!-- Fallback for non-tokenized text or while tokenizing -->
          <template v-else>
            <span class="subtitle-sentence text-white">
              <span v-if="isTokenizing" class="text-gray-300">Tokenizing...</span>
              <span v-else>{{ currentCue.text }}</span>
            </span>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.subtitle-word,
.subtitle-token {
  user-select: none;
}

.subtitle-sentence {
  user-select: text;
  font-size: 1.1em;
  line-height: 1.4;
}

.subtitle-word:hover,
.subtitle-token:hover {
  transform: scale(1.05);
}

.subtitle-word:active,
.subtitle-token:active {
  transform: scale(0.95);
}

.subtitle-token {
  margin: 0 1px;
}

/* Smooth transitions for subtitle appearance */
.subtitle-container {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
