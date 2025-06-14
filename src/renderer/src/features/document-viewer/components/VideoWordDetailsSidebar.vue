<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@renderer/common/components/ui/button'
import { ScrollArea } from '@renderer/common/components/ui/scroll-area'
import { Separator } from '@renderer/common/components/ui/separator'
import { X, Book, Globe, Lightbulb, History, Loader2, Puzzle, TrendingUp } from 'lucide-vue-next'

interface WordDetails {
  word: string
  lemma: string
  translation: string
  partOfSpeech: string
  definitions: string[]
  synonyms: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

interface Props {
  wordDetails: WordDetails | null
  isLoading?: boolean
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const hasWordDetails = computed(() => props.wordDetails !== null)

const partOfSpeechColor = computed(() => {
  if (!props.wordDetails) return ''

  const colors: Record<string, string> = {
    noun: 'bg-primary/20 text-primary border-primary/30',
    verb: 'bg-green-500/20 text-green-400 border-green-500/30',
    adjective: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    adverb: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    preposition: 'bg-destructive/20 text-destructive border-destructive/30',
    particle: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
  }

  return colors[props.wordDetails.partOfSpeech] || 'bg-muted text-muted-foreground border-border'
})

const difficultyColor = computed(() => {
  if (!props.wordDetails) return ''
  
  const colors: Record<string, string> = {
    beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
    intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    advanced: 'bg-red-500/20 text-red-400 border-red-500/30'
  }
  
  return colors[props.wordDetails.difficulty] || 'bg-muted text-muted-foreground border-border'
})
</script>

<template>
  <div class="video-word-sidebar">
    <!-- Header -->
    <div class="video-word-sidebar__header">
      <div class="video-word-sidebar__header-content">
        <Puzzle class="w-5 h-5 text-primary" />
        <h3 class="video-word-sidebar__title">UI Injected by Plugin</h3>
      </div>
      <Button
        variant="ghost"
        size="sm"
        class="video-word-sidebar__close"
        @click="emit('close')"
      >
        <X class="w-4 h-4" />
      </Button>
    </div>

    <Separator />

    <!-- Content -->
    <ScrollArea class="video-word-sidebar__content">
      <div v-if="props.isLoading" class="video-word-sidebar__loading">
        <Loader2 class="w-8 h-8 text-primary animate-spin mb-4" />
        <p class="text-muted-foreground text-center">Loading word details...</p>
      </div>
      
      <div v-else-if="!hasWordDetails" class="video-word-sidebar__empty">
        <Book class="w-12 h-12 text-muted-foreground/50 mb-4" />
        <p class="text-muted-foreground text-center">
          Click on a highlighted word in the subtitles to see its details here.
        </p>
        <p class="text-muted-foreground text-center text-sm mt-2">
          This sidebar demonstrates plugin-injected UI functionality.
        </p>
      </div>

      <div v-else class="video-word-sidebar__details">
        <!-- Word Header -->
        <div class="video-word-card">
          <div class="video-word-card__header">
            <div class="video-word-card__word-section">
              <div class="video-word-card__word-line">
                <span class="text-2xl font-bold text-primary">{{ wordDetails!.word }}</span>
                <span class="video-word-card__pos" :class="partOfSpeechColor">
                  {{ wordDetails!.partOfSpeech }}
                </span>
              </div>
              <div class="video-word-card__difficulty-line">
                <TrendingUp class="w-4 h-4 text-muted-foreground" />
                <span class="text-sm text-muted-foreground">Difficulty:</span>
                <span class="video-word-card__difficulty" :class="difficultyColor">
                  {{ wordDetails!.difficulty }}
                </span>
              </div>
            </div>
            <div class="video-word-card__lemma">
              <span class="text-sm text-muted-foreground">Root:</span>
              <span class="text-lg font-semibold">{{ wordDetails!.lemma }}</span>
            </div>
          </div>
        </div>

        <!-- Translation Section -->
        <div class="video-word-card">
          <div class="video-word-card__section-header">
            <Globe class="w-5 h-5 text-green-500" />
            <h4>Translation</h4>
          </div>
          <div class="video-word-card__content">
            <p class="text-lg font-medium text-primary">{{ wordDetails!.translation }}</p>
          </div>
        </div>

        <!-- Definitions Section -->
        <div class="video-word-card">
          <div class="video-word-card__section-header">
            <Book class="w-5 h-5 text-blue-500" />
            <h4>Definitions</h4>
          </div>
          <div class="video-word-card__content">
            <ol class="video-word-card__list">
              <li
                v-for="(definition, index) in wordDetails!.definitions"
                :key="index"
                class="video-word-card__list-item"
              >
                <span class="video-word-card__list-number">{{ index + 1 }}.</span>
                {{ definition }}
              </li>
            </ol>
          </div>
        </div>

        <!-- Synonyms Section -->
        <div class="video-word-card">
          <div class="video-word-card__section-header">
            <Lightbulb class="w-5 h-5 text-yellow-500" />
            <h4>Synonyms</h4>
          </div>
          <div class="video-word-card__content">
            <div class="video-word-card__synonyms">
              <span
                v-for="(synonym, index) in wordDetails!.synonyms"
                :key="index"
                class="video-word-card__synonym"
              >
                {{ synonym }}
              </span>
            </div>
          </div>
        </div>

        <!-- Plugin Actions -->
        <div class="video-word-sidebar__actions">
          <div class="video-word-sidebar__plugin-indicator">
            <Puzzle class="w-4 h-4 mr-2" />
            <span class="text-xs text-muted-foreground">Powered by Language Learning Plugin</span>
          </div>
          
          <Separator class="my-3" />
          
          <Button variant="outline" size="sm" class="video-word-sidebar__action-button">
            <Book class="w-4 h-4 mr-2" />
            Add to Vocabulary
          </Button>
          <Button variant="outline" size="sm" class="video-word-sidebar__action-button">
            <Globe class="w-4 h-4 mr-2" />
            Hear Pronunciation
          </Button>
          <Button variant="outline" size="sm" class="video-word-sidebar__action-button">
            <History class="w-4 h-4 mr-2" />
            View Context
          </Button>
        </div>
      </div>
    </ScrollArea>
  </div>
</template>

<style scoped>
.video-word-sidebar {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--color-border);
  background-color: var(--color-background);
  backdrop-filter: blur(8px);
}

.video-word-sidebar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
  background-color: color-mix(in srgb, var(--color-secondary) 30%, transparent);
}

.video-word-sidebar__header-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.video-word-sidebar__title {
  font-size: 1.125rem;
  font-weight: 600;
}

.video-word-sidebar__close {
  padding: 0.25rem;
  height: auto;
  width: auto;
}

.video-word-sidebar__close:hover {
  background-color: var(--color-secondary);
}

.video-word-sidebar__content {
  flex: 1;
  padding: 1rem;
}

.video-word-sidebar__empty,
.video-word-sidebar__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}

.video-word-sidebar__details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.video-word-card {
  background-color: var(--color-card);
  color: var(--color-card-foreground);
  border-radius: 0.5rem;
  border: 1px solid var(--color-border);
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  padding: 1rem;
  transition: all 0.2s ease;
}

.video-word-card:hover {
  box-shadow: 0 4px 8px 0 rgb(0 0 0 / 0.1);
  border-color: color-mix(in srgb, var(--color-primary) 20%, var(--color-border));
}

.video-word-card__header {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.video-word-card__word-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.video-word-card__word-line {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
}

.video-word-card__difficulty-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.video-word-card__pos,
.video-word-card__difficulty {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 9999px;
  border: 1px solid;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.video-word-card__pos:hover,
.video-word-card__difficulty:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.video-word-card__lemma {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background-color: color-mix(in srgb, var(--color-secondary) 30%, transparent);
  border-radius: 0.25rem;
}

.video-word-card__section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid color-mix(in srgb, var(--color-border) 50%, transparent);
}

.video-word-card__section-header h4 {
  font-weight: 600;
  font-size: 1rem;
  color: var(--color-foreground);
}

.video-word-card__content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.video-word-card__list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.video-word-card__list-item {
  display: flex;
  gap: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.4;
}

.video-word-card__list-number {
  font-weight: 600;
  min-width: 20px;
  color: var(--color-primary);
}

.video-word-card__synonyms {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.video-word-card__synonym {
  padding: 0.375rem 0.75rem;
  background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-primary) 20%, transparent);
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-primary);
  transition: all 0.2s ease;
}

.video-word-card__synonym:hover {
  background-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.video-word-sidebar__actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background-color: color-mix(in srgb, var(--color-secondary) 20%, transparent);
  border-radius: 0.5rem;
  border: 1px solid var(--color-border);
}

.video-word-sidebar__plugin-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  font-style: italic;
}

.video-word-sidebar__action-button {
  width: 100%;
  transition: all 0.2s ease;
  justify-content: flex-start;
}

.video-word-sidebar__action-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
