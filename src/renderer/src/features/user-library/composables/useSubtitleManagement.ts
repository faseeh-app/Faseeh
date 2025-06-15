import { ref, computed, onMounted, watch, type Ref } from 'vue'
import type { LibraryItem } from '@shared/types/types'
import type { SubtitleCue } from './useVideoPlayer'
import {
  extractSubtitleSources,
  getBestSubtitleSource,
  combineSubtitleSources
} from '../utilities/video-extractor'

// Default demo subtitles for testing
const defaultSubtitles: SubtitleCue[] = [
  {
    id: '1',
    start: 0,
    end: 4,
    text: 'Welcome to our interactive video player with clickable subtitles!',
    words: [
      { id: '1-1', text: 'Welcome', start: 0, end: 0.7, confidence: 0.95 },
      { id: '1-2', text: 'to', start: 0.7, end: 0.9, confidence: 0.98 },
      { id: '1-3', text: 'our', start: 0.9, end: 1.2, confidence: 0.92 },
      { id: '1-4', text: 'interactive', start: 1.2, end: 2.0, confidence: 0.88 },
      { id: '1-5', text: 'video', start: 2.0, end: 2.4, confidence: 0.96 },
      { id: '1-6', text: 'player', start: 2.4, end: 2.8, confidence: 0.94 },
      { id: '1-7', text: 'with', start: 2.8, end: 3.1, confidence: 0.97 },
      { id: '1-8', text: 'clickable', start: 3.1, end: 3.6, confidence: 0.91 },
      { id: '1-9', text: 'subtitles!', start: 3.6, end: 4.0, confidence: 0.89 }
    ]
  },
  {
    id: '2',
    start: 5,
    end: 9,
    text: 'Click on any word to see more information and interact with the content.',
    words: [
      { id: '2-1', text: 'Click', start: 5.0, end: 5.4, confidence: 0.97 },
      { id: '2-2', text: 'on', start: 5.4, end: 5.6, confidence: 0.99 },
      { id: '2-3', text: 'any', start: 5.6, end: 5.9, confidence: 0.93 },
      { id: '2-4', text: 'word', start: 5.9, end: 6.3, confidence: 0.91 },
      { id: '2-5', text: 'to', start: 6.3, end: 6.5, confidence: 0.98 },
      { id: '2-6', text: 'see', start: 6.5, end: 6.8, confidence: 0.96 },
      { id: '2-7', text: 'more', start: 6.8, end: 7.2, confidence: 0.94 },
      { id: '2-8', text: 'information', start: 7.2, end: 8.0, confidence: 0.87 },
      { id: '2-9', text: 'and', start: 8.0, end: 8.2, confidence: 0.98 },
      { id: '2-10', text: 'interact', start: 8.2, end: 8.7, confidence: 0.92 },
      { id: '2-11', text: 'with', start: 8.7, end: 8.9, confidence: 0.96 },
      { id: '2-12', text: 'the', start: 8.9, end: 9.0, confidence: 0.98 },
      { id: '2-13', text: 'content.', start: 9.0, end: 9.5, confidence: 0.94 }
    ]
  },
  {
    id: '3',
    start: 10,
    end: 14,
    text: 'This player supports multiple video formats and streaming services.',
    words: [
      { id: '3-1', text: 'This', start: 10.0, end: 10.3, confidence: 0.96 },
      { id: '3-2', text: 'player', start: 10.3, end: 10.8, confidence: 0.94 },
      { id: '3-3', text: 'supports', start: 10.8, end: 11.4, confidence: 0.92 },
      { id: '3-4', text: 'multiple', start: 11.4, end: 12.0, confidence: 0.89 },
      { id: '3-5', text: 'video', start: 12.0, end: 12.4, confidence: 0.95 },
      { id: '3-6', text: 'formats', start: 12.4, end: 12.9, confidence: 0.91 },
      { id: '3-7', text: 'and', start: 12.9, end: 13.1, confidence: 0.98 },
      { id: '3-8', text: 'streaming', start: 13.1, end: 13.7, confidence: 0.88 },
      { id: '3-9', text: 'services.', start: 13.7, end: 14.0, confidence: 0.93 }
    ]
  }
]

export interface UseSubtitleManagementOptions {
  fallbackToDemo?: boolean
}

export function useSubtitleManagement(
  libraryItem: Ref<LibraryItem>,
  options: UseSubtitleManagementOptions = {}
) {
  const { fallbackToDemo = true } = options

  // Reactive state
  const loadedSubtitles = ref<SubtitleCue[]>([])
  const isLoadingSubtitles = ref(false)
  const subtitleError = ref<string | null>(null)
  const currentCue = ref<SubtitleCue | null>(null)

  // Load subtitles from LibraryItem
  async function loadSubtitles() {
    isLoadingSubtitles.value = true
    subtitleError.value = null

    try {
      const subtitleSources = await extractSubtitleSources(libraryItem.value)
      const bestSource = getBestSubtitleSource(subtitleSources, libraryItem.value.language)

      if (bestSource && bestSource.cues.length > 0) {
        loadedSubtitles.value = bestSource.cues
      } else {
        // Try combining all available sources
        const allSubtitles = combineSubtitleSources(subtitleSources)
        loadedSubtitles.value = allSubtitles
      }
    } catch (error) {
      console.error('Error loading subtitles:', error)
      subtitleError.value = error instanceof Error ? error.message : 'Failed to load subtitles'
      loadedSubtitles.value = []
    } finally {
      isLoadingSubtitles.value = false
    }
  }

  // Get active subtitles (loaded or demo fallback)
  const activeSubtitles = computed(() => {
    if (loadedSubtitles.value.length > 0) {
      return loadedSubtitles.value
    }

    if (fallbackToDemo) {
      return defaultSubtitles
    }

    return []
  })

  // Find current subtitle cue based on time
  function findCurrentCue(time: number): SubtitleCue | null {
    return activeSubtitles.value.find((cue) => time >= cue.start && time <= cue.end) || null
  }

  // Update current cue based on video time
  function updateCurrentCue(time: number) {
    const newCue = findCurrentCue(time)
    if (newCue !== currentCue.value) {
      currentCue.value = newCue
    }
  }

  // Load subtitles when component mounts
  onMounted(() => {
    loadSubtitles()
  })

  // Watch for changes to libraryItem and reload subtitles
  watch(
    () => libraryItem.value.id,
    () => {
      loadSubtitles()
    }
  )
  return {
    // State
    loadedSubtitles,
    isLoadingSubtitles,
    subtitleError,
    currentCue,
    activeSubtitles,

    // Methods
    loadSubtitles,
    findCurrentCue,
    updateCurrentCue
  }
}
