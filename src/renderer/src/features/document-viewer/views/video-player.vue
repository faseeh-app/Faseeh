<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Button } from '@renderer/common/components/ui/button'
import { ScrollArea } from '@renderer/common/components/ui/scroll-area'
import { Separator } from '@renderer/common/components/ui/separator'
import { useTabRouter } from '@renderer/common/services/tabRouter'
import VideoWordDetailsSidebar from '../components/VideoWordDetailsSidebar.vue'
import {
  ChevronLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  ChevronRight,
  Clock,
  BookOpen,
  TrendingUp,
  BarChart3
} from 'lucide-vue-next'

const tabRouter = useTabRouter()

interface WordDetails {
  word: string
  lemma: string
  translation: string
  partOfSpeech: string
  definitions: string[]
  synonyms: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

interface SubtitleSegment {
  id: string
  startTime: number
  endTime: number
  text: string
  words: Array<{
    word: string
    startTime: number
    endTime: number
    isHighlighted: boolean
  }>
}

// Sample video data
const video = ref({
  title: 'Advanced English Conversation: Business Meeting',
  description:
    'Learn professional English vocabulary and expressions commonly used in business meetings and corporate environments.',
  duration: 1245, // seconds
  currentTime: 0,
  isPlaying: false,
  volume: 0.8,
  isMuted: false
})

// Sample subtitle data with highlightable words
const subtitles = ref<SubtitleSegment[]>([
  {
    id: '1',
    startTime: 0,
    endTime: 4.5,
    text: "Welcome everyone to today's quarterly business review meeting.",
    words: [
      { word: 'Welcome', startTime: 0, endTime: 0.8, isHighlighted: false },
      { word: 'everyone', startTime: 0.8, endTime: 1.3, isHighlighted: false },
      { word: 'to', startTime: 1.3, endTime: 1.5, isHighlighted: false },
      { word: "today's", startTime: 1.5, endTime: 2.0, isHighlighted: false },
      { word: 'quarterly', startTime: 2.1, endTime: 2.9, isHighlighted: true },
      { word: 'business', startTime: 2.9, endTime: 3.4, isHighlighted: true },
      { word: 'review', startTime: 3.4, endTime: 3.8, isHighlighted: true },
      { word: 'meeting.', startTime: 3.8, endTime: 4.5, isHighlighted: true }
    ]
  },
  {
    id: '2',
    startTime: 4.5,
    endTime: 9.2,
    text: "We'll be discussing our performance metrics and strategic initiatives for the upcoming quarter.",
    words: [
      { word: "We'll", startTime: 4.5, endTime: 4.8, isHighlighted: false },
      { word: 'be', startTime: 4.8, endTime: 4.9, isHighlighted: false },
      { word: 'discussing', startTime: 5.1, endTime: 5.8, isHighlighted: true },
      { word: 'our', startTime: 5.8, endTime: 5.9, isHighlighted: false },
      { word: 'performance', startTime: 5.9, endTime: 6.5, isHighlighted: true },
      { word: 'metrics', startTime: 6.5, endTime: 7.0, isHighlighted: true },
      { word: 'and', startTime: 7.0, endTime: 7.1, isHighlighted: false },
      { word: 'strategic', startTime: 7.3, endTime: 7.9, isHighlighted: true },
      { word: 'initiatives', startTime: 7.9, endTime: 8.7, isHighlighted: true },
      { word: 'for', startTime: 8.7, endTime: 8.8, isHighlighted: false },
      { word: 'the', startTime: 8.8, endTime: 8.9, isHighlighted: false },
      { word: 'upcoming', startTime: 8.9, endTime: 9.0, isHighlighted: false },
      { word: 'quarter.', startTime: 9.0, endTime: 9.2, isHighlighted: false }
    ]
  },
  {
    id: '3',
    startTime: 9.2,
    endTime: 14.1,
    text: 'Our revenue has increased by 15% this quarter, showing strong market performance.',
    words: [
      { word: 'Our', startTime: 9.2, endTime: 9.4, isHighlighted: false },
      { word: 'revenue', startTime: 9.4, endTime: 9.9, isHighlighted: true },
      { word: 'has', startTime: 9.9, endTime: 10.1, isHighlighted: false },
      { word: 'increased', startTime: 10.1, endTime: 10.7, isHighlighted: true },
      { word: 'by', startTime: 10.7, endTime: 10.8, isHighlighted: false },
      { word: '15%', startTime: 10.8, endTime: 11.3, isHighlighted: false },
      { word: 'this', startTime: 11.3, endTime: 11.5, isHighlighted: false },
      { word: 'quarter,', startTime: 11.5, endTime: 12.0, isHighlighted: false },
      { word: 'showing', startTime: 12.0, endTime: 12.4, isHighlighted: false },
      { word: 'strong', startTime: 12.4, endTime: 12.8, isHighlighted: false },
      { word: 'market', startTime: 12.8, endTime: 13.2, isHighlighted: false },
      { word: 'performance.', startTime: 13.2, endTime: 14.1, isHighlighted: true }
    ]
  },
  {
    id: '4',
    startTime: 14.1,
    endTime: 18.5,
    text: "Let's analyze the key factors that contributed to this success.",
    words: [
      { word: "Let's", startTime: 14.1, endTime: 14.5, isHighlighted: false },
      { word: 'analyze', startTime: 14.5, endTime: 15.1, isHighlighted: true },
      { word: 'the', startTime: 15.1, endTime: 15.2, isHighlighted: false },
      { word: 'key', startTime: 15.2, endTime: 15.5, isHighlighted: false },
      { word: 'factors', startTime: 15.5, endTime: 16.0, isHighlighted: true },
      { word: 'that', startTime: 16.0, endTime: 16.2, isHighlighted: false },
      { word: 'contributed', startTime: 16.2, endTime: 17.0, isHighlighted: true },
      { word: 'to', startTime: 17.0, endTime: 17.1, isHighlighted: false },
      { word: 'this', startTime: 17.1, endTime: 17.3, isHighlighted: false },
      { word: 'success.', startTime: 17.3, endTime: 18.5, isHighlighted: false }
    ]
  }
])

const selectedWord = ref<WordDetails | null>(null)
const isSidebarOpen = ref(true)
const isLoading = ref(false)
const currentSubtitle = ref<SubtitleSegment | null>(null)

// Mock highlighted words with their details
const wordDetails = new Map<string, WordDetails>([
  [
    'quarterly',
    {
      word: 'quarterly',
      lemma: 'quarterly',
      translation: 'happening every three months',
      partOfSpeech: 'adjective',
      definitions: [
        'Occurring, done, or published four times a year',
        'Relating to a quarter of a year'
      ],
      synonyms: ['three-monthly', 'seasonal', 'periodic'],
      difficulty: 'intermediate'
    }
  ],
  [
    'business',
    {
      word: 'business',
      lemma: 'business',
      translation: 'commercial enterprise or company',
      partOfSpeech: 'noun',
      definitions: [
        "The practice of making one's living by engaging in commerce",
        "A person's regular occupation, profession, or trade",
        'Commercial enterprises collectively'
      ],
      synonyms: ['commerce', 'trade', 'industry', 'enterprise'],
      difficulty: 'beginner'
    }
  ],
  [
    'performance',
    {
      word: 'performance',
      lemma: 'performance',
      translation: 'the execution of an action or task',
      partOfSpeech: 'noun',
      definitions: [
        'The action or process of carrying out or accomplishing a task',
        'The effectiveness of an organization or individual in achieving objectives',
        'A display of behavioral activity'
      ],
      synonyms: ['execution', 'achievement', 'accomplishment', 'results'],
      difficulty: 'intermediate'
    }
  ], 
  [
    'strategic',
    {
      word: 'strategic',
      lemma: 'strategic',
      translation: 'relating to long-term planning',
      partOfSpeech: 'adjective',
      definitions: [
        'Relating to the identification of long-term goals and the means of achieving them',
        'Designed or planned to serve a particular purpose',
        'Of great importance to a long-term plan'
      ],
      synonyms: ['tactical', 'planned', 'calculated', 'deliberate'],
      difficulty: 'advanced'
    }
  ],
  [
    'revenue',
    {
      word: 'revenue',
      lemma: 'revenue',
      translation: 'income from business operations',
      partOfSpeech: 'noun',
      definitions: [
        'Income that a company receives from its normal business operations',
        'The total amount of income generated by a business',
        'Government income from taxation or other sources'
      ],
      synonyms: ['income', 'earnings', 'proceeds', 'receipts'],
      difficulty: 'intermediate'
    }
  ],
  [
    'analyze',
    {
      word: 'analyze',
      lemma: 'analyze',
      translation: 'examine in detail',
      partOfSpeech: 'verb',
      definitions: [
        'Examine methodically and in detail the structure of something',
        'Discover or reveal through detailed examination',
        'Break down into components or essential features'
      ],
      synonyms: ['examine', 'study', 'investigate', 'scrutinize'],
      difficulty: 'intermediate'
    }
  ],
  [
    'factors',
    {
      word: 'factors',
      lemma: 'factor',
      translation: 'elements that contribute to a result',
      partOfSpeech: 'noun',
      definitions: [
        'A circumstance, fact, or influence that contributes to a result',
        'One of the elements that make up something',
        'A business that purchases and collects accounts receivable'
      ],
      synonyms: ['elements', 'components', 'aspects', 'variables'],
      difficulty: 'intermediate'
    }
  ]
])

// Video stats
const videoStats = computed(() => ({
  totalWords: 156,
  uniqueWords: 89,
  difficulty: 'Intermediate',
  completionRate: 34,
  highlightedWords: 23,
  averageWPM: 140
}))

function handleWordClick(word: string) {
  if (wordDetails.has(word)) {
    isLoading.value = true
    setTimeout(() => {
      selectedWord.value = wordDetails.get(word)!
      isSidebarOpen.value = true
      isLoading.value = false
    }, 200)
  }
}

function closeSidebar() {
  isSidebarOpen.value = false
  selectedWord.value = null
}

async function goBack() {
  const success = await tabRouter.back()
  if (!success) {
    await tabRouter.push({ name: 'library' }, { title: 'Library' })
  }
}

function togglePlay() {
  video.value.isPlaying = !video.value.isPlaying
}

function toggleMute() {
  video.value.isMuted = !video.value.isMuted
}

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Simulate current subtitle based on time
onMounted(() => {
  setInterval(() => {
    if (video.value.isPlaying) {
      video.value.currentTime += 0.1

      // Find current subtitle
      const current = subtitles.value.find(
        (sub) => video.value.currentTime >= sub.startTime && video.value.currentTime <= sub.endTime
      )
      currentSubtitle.value = current || null
    }
  }, 100)
})
</script>

<template>
  <div class="video-player">
    <!-- Header -->
    <div class="video-player__header">
      <Button variant="ghost" size="sm" class="video-player__back-button" @click="goBack">
        <ChevronLeft class="w-4 h-4 mr-2" />
        Back to Library
      </Button>

      <div class="video-player__video-info">
        <div class="video-player__video-title">
          <Play class="w-5 h-5 mr-2 text-primary" />
          {{ video.title }}
        </div>
        <div class="video-player__video-description">
          {{ video.description }}
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        class="video-player__sidebar-toggle"
        @click="toggleSidebar"
      >
        <ChevronRight
          class="w-4 h-4 mr-2 transition-transform duration-200"
          :class="{ 'rotate-180': isSidebarOpen }"
        />
        {{ isSidebarOpen ? 'Hide' : 'Show' }} Plugin
      </Button>
    </div>

    <Separator />

    <!-- Main Content -->
    <div class="video-player__main" :class="{ 'video-player__main--sidebar-open': isSidebarOpen }">
      <!-- Video and Subtitles Section -->
      <div class="video-player__content">
        <!-- Video Player with Overlaid Subtitles -->
        <div class="video-player__video-container">
          <div class="video-player__video-area">
            <!-- Video placeholder with actual thumbnail -->
            <div class="video-player__video-placeholder">
              <img
                src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=450&fit=crop"
                alt="Business meeting video thumbnail"
                class="video-player__video-thumbnail"
              />
              <div class="video-player__video-overlay">
                <Button
                  variant="ghost"
                  size="lg"
                  class="video-player__play-button"
                  @click="togglePlay"
                >
                  <Play v-if="!video.isPlaying" class="w-12 h-12" />
                  <Pause v-else class="w-12 h-12" />
                </Button>
              </div>

              <!-- Subtitles Overlay -->
              <div class="video-player__subtitles-overlay">
                <div v-if="currentSubtitle" class="video-player__current-subtitle">
                  <template v-for="(word, index) in currentSubtitle.words" :key="index">
                    <span
                      v-if="word.isHighlighted"
                      class="video-player__subtitle-word video-player__subtitle-word--highlighted"
                      @click="handleWordClick(word.word)"
                    >
                      {{ word.word }}
                    </span>
                    <span v-else class="video-player__subtitle-word">
                      {{ word.word }}
                    </span>
                    {{ index < currentSubtitle.words.length - 1 ? ' ' : '' }}
                  </template>
                </div>
              </div>
            </div>

            <!-- Video Controls -->
            <div class="video-player__controls">
              <div class="video-player__progress-container">
                <div class="video-player__progress-bar">
                  <div
                    class="video-player__progress-fill"
                    :style="{ width: `${(video.currentTime / video.duration) * 100}%` }"
                  ></div>
                </div>
              </div>

              <div class="video-player__control-buttons">
                <Button variant="ghost" size="sm" @click="togglePlay">
                  <Play v-if="!video.isPlaying" class="w-4 h-4" />
                  <Pause v-else class="w-4 h-4" />
                </Button>

                <Button variant="ghost" size="sm" @click="toggleMute">
                  <Volume2 v-if="!video.isMuted" class="w-4 h-4" />
                  <VolumeX v-else class="w-4 h-4" />
                </Button>

                <div class="video-player__time-display">
                  {{ formatTime(video.currentTime) }} / {{ formatTime(video.duration) }}
                </div>

                <div class="video-player__control-spacer"></div>

                <Button variant="ghost" size="sm">
                  <Settings class="w-4 h-4" />
                </Button>

                <Button variant="ghost" size="sm">
                  <Maximize class="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <!-- Interactive Subtitles List (Below Video) -->
        <div class="video-player__subtitles-section">
          <h3 class="video-player__subtitles-title">
            <BookOpen class="w-5 h-5 mr-2" />
            Highlightable and Interactive Subtitles
          </h3>

          <ScrollArea class="video-player__subtitles-container">
            <div class="video-player__subtitles">
              <div
                v-for="subtitle in subtitles"
                :key="subtitle.id"
                class="video-player__subtitle-segment"
                :class="{
                  'video-player__subtitle-segment--active': currentSubtitle?.id === subtitle.id
                }"
              >
                <div class="video-player__subtitle-time">
                  {{ formatTime(subtitle.startTime) }}
                </div>
                <div class="video-player__subtitle-text">
                  <template v-for="(word, index) in subtitle.words" :key="index">
                    <span
                      v-if="word.isHighlighted"
                      class="video-player__subtitle-word video-player__subtitle-word--highlighted"
                      @click="handleWordClick(word.word)"
                    >
                      {{ word.word }}
                    </span>
                    <span v-else class="video-player__subtitle-word">
                      {{ word.word }}
                    </span>
                    {{ index < subtitle.words.length - 1 ? ' ' : '' }}
                  </template>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>

      <!-- Plugin Sidebar -->
      <Transition name="sidebar">
        <VideoWordDetailsSidebar
          v-if="isSidebarOpen"
          class="video-player__sidebar"
          :word-details="selectedWord"
          :is-loading="isLoading"
          @close="closeSidebar"
        />
      </Transition>
    </div>

    <!-- Status Bar -->
    <div class="video-player__status-bar">
      <div class="video-player__stats">
        <div class="video-player__stat-item">
          <Clock class="w-4 h-4 mr-1" />
          <span class="video-player__stat-label">Duration:</span>
          <span class="video-player__stat-value">{{ formatTime(video.duration) }}</span>
        </div>

        <Separator orientation="vertical" class="h-4" />

        <div class="video-player__stat-item">
          <BookOpen class="w-4 h-4 mr-1" />
          <span class="video-player__stat-label">Words:</span>
          <span class="video-player__stat-value">{{ videoStats.totalWords }}</span>
        </div>

        <Separator orientation="vertical" class="h-4" />

        <div class="video-player__stat-item">
          <TrendingUp class="w-4 h-4 mr-1" />
          <span class="video-player__stat-label">Difficulty:</span>
          <span
            class="video-player__stat-badge"
            :class="`video-player__stat-badge--${videoStats.difficulty.toLowerCase()}`"
          >
            {{ videoStats.difficulty }}
          </span>
        </div>

        <Separator orientation="vertical" class="h-4" />

        <div class="video-player__stat-item">
          <BarChart3 class="w-4 h-4 mr-1" />
          <span class="video-player__stat-label">Progress:</span>
          <div class="video-player__progress-mini">
            <div
              class="video-player__progress-mini-fill"
              :style="{ width: `${videoStats.completionRate}%` }"
            ></div>
          </div>
          <span class="video-player__stat-value">{{ videoStats.completionRate }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.video-player {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--color-background);
  color: var(--color-foreground);
  overflow: hidden;
}

.video-player__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
  background-color: color-mix(in srgb, var(--color-card) 80%, transparent);
  backdrop-filter: blur(8px);
  gap: 1rem;
  min-height: 64px; /* Ensure header has a minimum height */
  flex-shrink: 0; /* Prevent header from shrinking */
}

.video-player__back-button {
  color: var(--color-muted-foreground);
}

.video-player__back-button:hover {
  color: var(--color-foreground);
}

.video-player__video-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1; /* Allow it to take available space */
  min-width: 0; /* Prevent text overflow issues in flex children */
  max-width: 600px; /* Constrain its maximum width */
  text-align: center;
}

.video-player__video-title {
  display: flex;
  align-items: center;
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  /* Truncate long titles if necessary */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.video-player__video-description {
  font-size: 0.875rem;
  color: var(--color-muted-foreground);
  line-height: 1.4;
  /* Allow wrapping for description */
  white-space: normal;
  overflow: hidden;
  /* For multi-line ellipsis (not universally supported, but good fallback) */
  display: -webkit-box;
  -webkit-line-clamp: 2; /* Show 2 lines */
  -webkit-box-orient: vertical;
  max-width: 100%;
}

.video-player__sidebar-toggle {
  min-width: 120px; /* Ensure button text is visible */
}

.video-player__main {
  display: flex;
  flex: 1; /* Take remaining vertical space */
  overflow: hidden; /* Manage overflow for children */
  /* transition: all 0.3s ease; /* Note: display and grid-template-columns don't transition smoothly */
}

.video-player__main--sidebar-open {
  display: grid;
  grid-template-columns: 1fr 400px; /* Main content and fixed-width sidebar */
}

.video-player__content {
  flex: 1; /* Take available space in flex or grid layout */
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Handles its own overflow, particularly for scroll areas */
  min-height: 0; /* Important for flex children that need to scroll */
  padding: 1rem; /* Centralized padding */
  gap: 1rem; /* Spacing between video container and subtitles section */
}

.video-player__video-container {
  flex: 0 0 auto; /* Shrink to content, don't grow. Based on video-area's aspect ratio */
  position: relative; /* For absolutely positioned children like controls */
  /* min-height: 300px; /* REMOVED: Let aspect-ratio dictate height */
}

.video-player__video-area {
  position: relative;
  background-color: #000;
  aspect-ratio: 16/9; /* Key for video dimensioning */
  border-radius: 0.5rem;
  /* margin: 1rem; /* REMOVED: Handled by .video-player__content padding */
  overflow: hidden; /* Clip content like placeholder image to border-radius */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.video-player__video-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.video-player__video-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover; /* Cover the area without distortion */
}

.video-player__video-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.video-player__video-placeholder:hover .video-player__video-overlay,
.video-player__video-placeholder:focus-within .video-player__video-overlay {
  /* Show on focus for accessibility */
  opacity: 1;
}

.video-player__subtitles-overlay {
  position: absolute;
  bottom: 80px; /* Adjust based on controls height */
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  padding: 0 2rem; /* Horizontal padding for the subtitle box */
  pointer-events: none; /* Allow clicks to pass through overlay background */
}

.video-player__current-subtitle {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 1.125rem;
  line-height: 1.4;
  text-align: center;
  max-width: 80%; /* Prevent subtitle from being too wide */
  backdrop-filter: blur(8px);
  pointer-events: auto; /* Enable pointer events for the subtitle text itself */
}

.video-player__current-subtitle .video-player__subtitle-word--highlighted {
  background-color: rgba(255, 255, 255, 0.2);
  border-bottom: 2px solid var(--color-primary, #3b82f6); /* Fallback for --color-primary */
  cursor: pointer;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.video-player__current-subtitle .video-player__subtitle-word--highlighted:hover {
  background-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.video-player__play-button {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  border-radius: 50%;
  width: 80px;
  height: 80px;
  color: white;
}
.video-player__play-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.video-player__controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  padding: 1rem;
  padding-top: 0.5rem; /* Less padding on top, more overall due to gradient */
}

.video-player__progress-container {
  margin-bottom: 0.5rem;
}

.video-player__progress-bar {
  width: 100%;
  height: 4px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
  cursor: pointer; /* Indicate it's interactive */
}

.video-player__progress-fill {
  height: 100%;
  background-color: var(--color-primary, #3b82f6);
  transition: width 0.1s linear; /* Use linear for smoother time updates */
}

.video-player__control-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
}
.video-player__control-buttons > Button {
  color: white;
}
.video-player__control-buttons > Button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.video-player__time-display {
  font-size: 0.875rem;
  font-weight: 500;
  min-width: 100px; /* e.g., "0:00 / 20:45" */
  text-align: center;
}

.video-player__control-spacer {
  flex: 1; /* Pushes right-side controls to the end */
}

.video-player__subtitles-section {
  flex: 1; /* Take remaining space after video container */
  display: flex;
  flex-direction: column;
  /* padding: 1rem; /* REMOVED: Handled by .video-player__content padding */
  overflow: hidden; /* Ensure this section manages its own overflow */
  min-height: 0; /* Crucial for scrollable flex children */
}

.video-player__subtitles-title {
  display: flex;
  align-items: center;
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1rem; /* Space between title and scroll area */
  color: var(--color-primary, #3b82f6);
  flex-shrink: 0; /* Prevent title from shrinking */
}

.video-player__subtitles-container {
  flex: 1; /* Allow ScrollArea to take up available space */
  min-height: 0; /* Essential for ScrollArea to work within flex */
}

.video-player__subtitles {
  padding: 1rem; /* Inner padding for the scrollable content */
  background-color: color-mix(in srgb, var(--color-card) 60%, transparent);
  border-radius: 0.5rem;
  border: 1px solid var(--color-border);
}

.video-player__subtitle-segment {
  display: flex;
  gap: 1rem;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
  cursor: pointer; /* Indicate clickable segments */
}
.video-player__subtitle-segment:last-child {
  margin-bottom: 0;
}
.video-player__subtitle-segment:hover {
  background-color: color-mix(in srgb, var(--color-muted) 50%, transparent);
}

.video-player__subtitle-segment--active {
  background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
  border-left: 3px solid var(--color-primary, #3b82f6);
  padding-left: calc(0.75rem - 3px); /* Adjust padding to maintain text alignment */
}
.video-player__subtitle-segment--active:hover {
  background-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
}

.video-player__subtitle-time {
  font-size: 0.75rem;
  color: var(--color-muted-foreground);
  font-weight: 500;
  min-width: 50px; /* "00:00" */
  flex-shrink: 0;
  padding-top: 0.2rem; /* Align better with text line */
}

.video-player__subtitle-text {
  line-height: 1.6;
  font-size: 0.95rem;
}

.video-player__subtitle-word {
  transition: all 0.2s ease;
}

.video-player__subtitle-word--highlighted {
  background-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
  border-bottom: 2px solid var(--color-primary, #3b82f6);
  cursor: pointer;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-weight: 500;
}

.video-player__subtitle-word--highlighted:hover {
  background-color: color-mix(in srgb, var(--color-primary) 25%, transparent);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.video-player__sidebar {
  border-left: 1px solid var(--color-border);
  background-color: var(--color-background);
  /* Sidebar width is controlled by grid-template-columns or fixed positioning */
}

.video-player__status-bar {
  border-top: 1px solid var(--color-border);
  background-color: color-mix(in srgb, var(--color-secondary) 30%, transparent);
  padding: 0.75rem 1rem;
  flex-shrink: 0; /* Prevent status bar from shrinking */
  min-height: 60px; /* Ensure a minimum height */
  display: flex; /* Added for alignment if needed, though .video-player__stats handles items */
  align-items: center; /* Vertically align content if status bar is taller */
}

.video-player__stats {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.875rem;
  width: 100%; /* Take full width of status bar */
  flex-wrap: nowrap; /* Default, overridden in responsive for wrapping */
  overflow-x: auto; /* Allow horizontal scroll on very small screens if no wrap */
}

.video-player__stat-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0; /* Prevent items from shrinking too much before wrapping/scrolling */
}

.video-player__stat-label {
  color: var(--color-muted-foreground);
  font-weight: 500;
  white-space: nowrap;
}

.video-player__stat-value {
  color: var(--color-foreground);
  font-weight: 600;
  white-space: nowrap;
}

.video-player__stat-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  white-space: nowrap;
}

.video-player__stat-badge--beginner {
  background-color: color-mix(in srgb, #22c55e 20%, transparent);
  color: #22c55e;
  border: 1px solid color-mix(in srgb, #22c55e 30%, transparent);
}

.video-player__stat-badge--intermediate {
  background-color: color-mix(in srgb, #f59e0b 20%, transparent);
  color: #f59e0b;
  border: 1px solid color-mix(in srgb, #f59e0b 30%, transparent);
}

.video-player__stat-badge--advanced {
  background-color: color-mix(in srgb, #ef4444 20%, transparent);
  color: #ef4444;
  border: 1px solid color-mix(in srgb, #ef4444 30%, transparent);
}

.video-player__progress-mini {
  width: 60px;
  height: 8px;
  background-color: var(--color-muted);
  border-radius: 4px;
  overflow: hidden;
}

.video-player__progress-mini-fill {
  height: 100%;
  background-color: var(--color-primary, #3b82f6);
  transition: width 0.3s ease;
}

/* Responsive design */
@media (max-width: 1024px) {
  /* Adjust breakpoint for stats wrapping earlier */
  .video-player__stats {
    flex-wrap: wrap; /* Allow stats to wrap on medium screens */
    gap: 0.75rem; /* Adjust gap for wrapped items */
  }
}

@media (max-width: 768px) {
  .video-player__header {
    padding: 0.75rem;
    gap: 0.75rem;
  }
  .video-player__video-title {
    font-size: 1rem;
  }
  .video-player__video-description {
    font-size: 0.8rem;
    -webkit-line-clamp: 1; /* Show 1 line on mobile for description */
  }
  .video-player__sidebar-toggle {
    min-width: auto; /* Allow button to shrink */
    padding: 0.5rem; /* Adjust padding */
  }
  .video-player__sidebar-toggle .mr-2 {
    margin-right: 0.25rem; /* Reduce margin for icon */
  }

  .video-player__content {
    padding: 0.5rem; /* Reduced padding on smaller screens */
    gap: 0.5rem; /* Reduced gap on smaller screens */
  }

  /* .video-player__video-area margin is removed, parent padding handles it */
  /* Remove .video-player__video-area { margin: 0.5rem; } */

  .video-player__main--sidebar-open {
    grid-template-columns: 1fr; /* Content takes full width, sidebar is overlay */
  }

  .video-player__sidebar {
    position: fixed;
    top: 0; /* Cover full height */
    right: 0;
    bottom: 0;
    width: 100%; /* Take full width or a max-width */
    max-width: 320px; /* Slightly smaller sidebar on mobile */
    z-index: 50; /* Ensure sidebar is on top */
    box-shadow: -4px 0 8px rgba(0, 0, 0, 0.1);
    border-left: none; /* Remove border if it's overlaying */
  }

  .video-player__current-subtitle {
    font-size: 1rem;
    padding: 0.5rem 1rem;
    bottom: 70px; /* Adjust if controls height changes on mobile */
  }

  .video-player__controls {
    padding: 0.5rem;
  }
  .video-player__control-buttons {
    gap: 0.25rem;
  }
  .video-player__time-display {
    font-size: 0.8rem;
    min-width: 80px;
  }

  .video-player__status-bar {
    padding: 0.5rem 0.75rem;
    min-height: auto; /* Allow status bar to shrink if content wraps */
  }
  .video-player__stats {
    gap: 0.5rem; /* Tighter gap for wrapped items on mobile */
  }
}

/* Sidebar transition */
.sidebar-enter-active,
.sidebar-leave-active {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}

.sidebar-enter-from,
.sidebar-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* Ensure :root or a parent defines these CSS variables, e.g.: */
/*
:root {
  --color-background: #ffffff;
  --color-foreground: #020817;
  --color-card: #ffffff;
  --color-border: #e2e8f0;
  --color-primary: #3b82f6;
  --color-secondary: #f1f5f9;
  --color-muted: #f1f5f9;
  --color-muted-foreground: #64748b;
}
.dark {
  --color-background: #020817;
  --color-foreground: #f8fafc;
  --color-card: #0f172a;
  --color-border: #1e293b;
  --color-primary: #2563eb;
  --color-secondary: #1e293b;
  --color-muted: #1e293b;
  --color-muted-foreground: #94a3b8;
}
*/
</style>
