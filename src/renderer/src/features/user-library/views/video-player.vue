<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { LibraryItem } from '@shared/types/types'
import type { SubtitleCue, SubtitleWord } from '../composables/useVideoPlayer'
import type { Token } from '@shared/types/text-tokenizer-types'

import VideoPlayerCore from '@renderer/features/user-library/components/video-player/VideoPlayerCore.vue'
import InteractiveSubtitles from '@renderer/features/user-library/components/video-player/InteractiveSubtitles.vue'

import { createDemoLibraryItem } from '@renderer/features/user-library/utilities/video-extractor'
import { useSubtitleManagement } from '@renderer/features/user-library/composables/useSubtitleManagement'
import { storage } from '@renderer/core/services/service-container'

interface Props {
  libraryItem?: LibraryItem
  theme?: 'default' | 'dark' | 'light'
  autoplay?: boolean
  showControls?: boolean
  devMode?: boolean
  fallbackVideoUrl?: string
  showSubtitles?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'dark',
  autoplay: false,
  showControls: true,
  devMode: false,
  fallbackVideoUrl: 'https://www.youtube.com/watch?v=LXb3EKWsInQ',
  showSubtitles: true
})

const route = useRoute()

const loadedLibraryItem = ref<LibraryItem | null>(null)
const isLoading = ref(false)
const loadError = ref<string | null>(null)

const loadLibraryItem = async () => {
  const itemId = route.params.id as string

  if (!itemId) {
    return
  }

  isLoading.value = true
  loadError.value = null

  try {
    const item = await storage().getLibraryItemById(itemId)

    if (!item) {
      throw new Error(`Library item not found: ${itemId}`)
    }
    loadedLibraryItem.value = item
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Failed to load library item'
  } finally {
    isLoading.value = false
  }
}

const demoLibraryItem = createDemoLibraryItem(
  props.fallbackVideoUrl || 'https://www.youtube.com/watch?v=LXb3EKWsInQ',
  true
)

const activeLibraryItem = computed(() => {
  if (loadedLibraryItem.value) {
    return loadedLibraryItem.value
  } else if (props.libraryItem) {
    return props.libraryItem
  } else if (props.devMode) {
    return demoLibraryItem
  } else {
    return demoLibraryItem
  }
})

const { currentCue, activeSubtitles, updateCurrentCue, isLoadingSubtitles, subtitleError } =
  useSubtitleManagement(activeLibraryItem)

const videoPlayerCore = ref<InstanceType<typeof VideoPlayerCore>>()

function handleWordClick(word: SubtitleWord, cue: SubtitleCue) {
  // Add custom word click logic here
}

function handleTokenClick(token: Token, cue: SubtitleCue) {
  console.log('Token clicked:', token.text)
  // Add custom token click logic here
}

function handleTimeUpdate(currentTime: number) {
  updateCurrentCue(currentTime)
}

interface Emits {
  wordClick: [word: SubtitleWord, cue: SubtitleCue]
  tokenClick: [token: Token, cue: SubtitleCue]
  playerReady: [player: any]
  timeUpdate: [currentTime: number]
}

const emit = defineEmits<Emits>()

function handlePlayerReady(player: any) {
  emit('playerReady', player)
}

function handleWordClickEmit(word: SubtitleWord, cue: SubtitleCue) {
  emit('wordClick', word, cue)
  handleWordClick(word, cue)
}

function handleTokenClickEmit(token: Token, cue: SubtitleCue) {
  emit('tokenClick', token, cue)
  handleTokenClick(token, cue)
}

function handleTimeUpdateEmit(currentTime: number) {
  emit('timeUpdate', currentTime)
  handleTimeUpdate(currentTime)
}

onMounted(() => {
  loadLibraryItem()
})

watch(
  () => route.params.id,
  () => {
    if (route.params.id) {
      loadLibraryItem()
    }
  },
  { immediate: false }
)
</script>

<template>
  <div class="video-player-minimal">
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <div class="loading-text">Loading video...</div>
    </div>

    <div v-else-if="loadError" class="error-container">
      <div class="error-icon">⚠️</div>
      <div class="error-text">{{ loadError }}</div>
      <button @click="loadLibraryItem" class="retry-button">Retry</button>
    </div>

    <VideoPlayerCore
      v-else
      ref="videoPlayerCore"
      :library-item="activeLibraryItem"
      :theme="theme"
      :autoplay="autoplay"
      :show-controls="showControls"
      :fallback-video-url="fallbackVideoUrl"
      @player-ready="handlePlayerReady"
      @time-update="handleTimeUpdateEmit"
    >
      <InteractiveSubtitles
        v-if="showSubtitles"
        :current-cue="currentCue"
        :visible="activeSubtitles.length > 0"
        @word-click="handleWordClickEmit"
        @token-click="handleTokenClickEmit"
      />
    </VideoPlayerCore>

    <div v-if="isLoadingSubtitles" class="loading-indicator">Loading subtitles...</div>

    <div v-if="subtitleError" class="error-indicator">Error: {{ subtitleError }}</div>
  </div>
</template>

<style scoped>
.video-player-minimal {
  width: 100%;
  height: 100%;
  position: relative;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 1rem;
}

.loading-spinner {
  width: 3rem;
  height: 3rem;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  color: white;
  font-size: 1.1rem;
  font-weight: 500;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 1rem;
  text-align: center;
  padding: 2rem;
}

.error-icon {
  font-size: 3rem;
}

.error-text {
  color: #ef4444;
  font-size: 1.1rem;
  font-weight: 500;
  max-width: 32rem;
}

.retry-button {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.retry-button:hover {
  background: #2563eb;
}

.retry-button:active {
  background: #1d4ed8;
}

.loading-indicator {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  z-index: 10;
}

.error-indicator {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  z-index: 10;
}
</style>
