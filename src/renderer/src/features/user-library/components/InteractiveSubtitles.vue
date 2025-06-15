<script setup lang="ts">
import { computed } from 'vue'
import type { SubtitleCue, SubtitleWord } from '../composables/useVideoPlayer'

interface Props {
  currentCue: SubtitleCue | null
  visible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: true
})

interface Emits {
  wordClick: [word: SubtitleWord, cue: SubtitleCue]
}

const emit = defineEmits<Emits>()

function handleWordClick(word: SubtitleWord) {
  if (props.currentCue) {
    emit('wordClick', word, props.currentCue)
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
      </div>
    </div>
  </div>
</template>

<style scoped>
.subtitle-word {
  user-select: none;
}

.subtitle-word:hover {
  transform: scale(1.05);
}

.subtitle-word:active {
  transform: scale(0.95);
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
