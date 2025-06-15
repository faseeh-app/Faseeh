<script setup lang="ts">
import { ref, computed } from 'vue'
import type { LibraryItem } from '@shared/types/types'
import type { SubtitleCue, SubtitleWord } from '../composables/useVideoPlayer'

// Import minimal components
import VideoPlayerCore from '../components/VideoPlayerCore.vue'
import InteractiveSubtitles from '../components/InteractiveSubtitles.vue'

// Import utilities
import { createDemoLibraryItem } from '../utilities/video-extractor'
import { useSubtitleManagement } from '../composables/useSubtitleManagement'

/**
 * Minimal Video Player Component
 *
 * Features:
 * - Video playback (YouTube, MP4, etc.)
 * - Interactive clickable subtitles
 * - LibraryItem-based content loading
 * - Development mode for testing
 */

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
  devMode: true,
  fallbackVideoUrl: 'https://www.youtube.com/watch?v=LXb3EKWsInQ',
  showSubtitles: true
})

// Create demo LibraryItem for development/testing
const demoLibraryItem = createDemoLibraryItem(
  props.fallbackVideoUrl || 'https://www.youtube.com/watch?v=LXb3EKWsInQ',
  true
)

// Determine which LibraryItem to use
const activeLibraryItem = computed(() => {
  if (props.libraryItem) {
    return props.libraryItem
  } else if (props.devMode) {
    console.warn('[VideoPlayer] Development mode: Using demo LibraryItem')
    return demoLibraryItem
  } else {
    console.warn('[VideoPlayer] No LibraryItem provided, automatically enabling development mode')
    return demoLibraryItem
  }
})

// Subtitle management
const { currentCue, activeSubtitles, updateCurrentCue, isLoadingSubtitles, subtitleError } =
  useSubtitleManagement(activeLibraryItem)

// Video player ref for controls
const videoPlayerCore = ref<InstanceType<typeof VideoPlayerCore>>()

// Event handlers
function handleWordClick(word: SubtitleWord, cue: SubtitleCue) {
  console.log('Word clicked:', word.text, 'from cue:', cue.text)
  // Add custom word click logic here
}

function handleTimeUpdate(currentTime: number) {
  updateCurrentCue(currentTime)
}

// Emits for parent component integration
interface Emits {
  wordClick: [word: SubtitleWord, cue: SubtitleCue]
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

function handleTimeUpdateEmit(currentTime: number) {
  emit('timeUpdate', currentTime)
  handleTimeUpdate(currentTime)
}
</script>

<template>
  <div class="video-player-minimal">
    <VideoPlayerCore
      ref="videoPlayerCore"
      :library-item="activeLibraryItem"
      :theme="theme"
      :autoplay="autoplay"
      :show-controls="showControls"
      :fallback-video-url="fallbackVideoUrl"
      @player-ready="handlePlayerReady"
      @time-update="handleTimeUpdateEmit"
    >
      <!-- Interactive Subtitles Overlay -->
      <InteractiveSubtitles
        v-if="showSubtitles"
        :current-cue="currentCue"
        :visible="activeSubtitles.length > 0"
        @word-click="handleWordClickEmit"
      />
    </VideoPlayerCore>

    <!-- Loading indicator for subtitles -->
    <div v-if="isLoadingSubtitles" class="loading-indicator">Loading subtitles...</div>

    <!-- Subtitle error indicator -->
    <div v-if="subtitleError" class="error-indicator">Error: {{ subtitleError }}</div>
  </div>
</template>

<style scoped>
.video-player-minimal {
  width: 100%;
  height: 100%;
  position: relative;
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
