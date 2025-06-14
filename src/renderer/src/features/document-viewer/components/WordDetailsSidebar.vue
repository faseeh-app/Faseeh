<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@renderer/common/components/ui/button'
import { ScrollArea } from '@renderer/common/components/ui/scroll-area'
import { Separator } from '@renderer/common/components/ui/separator'
import { X, Book, Globe, Lightbulb, History, Loader2 } from 'lucide-vue-next'

interface WordDetails {
  word: string
  lemma: string
  translation: string
  partOfSpeech: string
  definitions: string[]
  examples: string[]
  etymology?: string
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
</script>

<template>
  <div class="word-details-sidebar">
    <!-- Header -->
    <div class="word-details-sidebar__header">
      <h3 class="word-details-sidebar__title">Word Details</h3>
      <Button
        variant="ghost"
        size="sm"
        @click="emit('close')"
        class="word-details-sidebar__close"
      >
        <X class="w-4 h-4" />
      </Button>
    </div>

    <Separator />

    <!-- Content -->
    <ScrollArea class="word-details-sidebar__content">
      <div v-if="props.isLoading" class="word-details-sidebar__loading">
        <Loader2 class="w-8 h-8 text-primary animate-spin mb-4" />
        <p class="text-muted-foreground text-center">Loading word details...</p>
      </div>
      
      <div v-else-if="!hasWordDetails" class="word-details-sidebar__empty">
        <Book class="w-12 h-12 text-muted-foreground/50 mb-4" />
        <p class="text-muted-foreground text-center">
          Click on a highlighted word in the document to see its details here.
        </p>
      </div>

      <div v-else class="word-details-sidebar__details">
        <!-- Word Header -->
        <div class="word-details-card">
          <div class="word-details-card__header">
            <div class="word-details-card__word">
              <span class="text-2xl font-bold text-primary">{{ wordDetails!.word }}</span>
              <span
                class="word-details-card__pos"
                :class="partOfSpeechColor"
              >
                {{ wordDetails!.partOfSpeech }}
              </span>
            </div>
            <div class="word-details-card__lemma">
              <span class="text-sm text-muted-foreground">Root:</span>
              <span class="text-lg font-semibold">{{ wordDetails!.lemma }}</span>
            </div>
          </div>
        </div>

        <!-- Translation Section -->
        <div class="word-details-card">
          <div class="word-details-card__section-header">
            <Globe class="w-5 h-5 text-green-500" />
            <h4>Translation</h4>
          </div>
          <div class="word-details-card__content">
            <p class="text-lg font-medium text-primary">{{ wordDetails!.translation }}</p>
          </div>
        </div>

        <!-- Definitions Section -->
        <div class="word-details-card">
          <div class="word-details-card__section-header">
            <Book class="w-5 h-5 text-blue-500" />
            <h4>Definitions</h4>
          </div>
          <div class="word-details-card__content">
            <ol class="word-details-card__list">
              <li
                v-for="(definition, index) in wordDetails!.definitions"
                :key="index"
                class="word-details-card__list-item"
              >
                <span class="word-details-card__list-number">{{ index + 1 }}.</span>
                {{ definition }}
              </li>
            </ol>
          </div>
        </div>

        <!-- Examples Section -->
        <div class="word-details-card">
          <div class="word-details-card__section-header">
            <Lightbulb class="w-5 h-5 text-yellow-500" />
            <h4>Examples</h4>
          </div>
          <div class="word-details-card__content">
            <div class="space-y-3">
              <div
                v-for="(example, index) in wordDetails!.examples"
                :key="index"
                class="word-details-card__example"
              >
                <p class="text-base font-medium mb-1">{{ example }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Etymology Section -->
        <div v-if="wordDetails!.etymology" class="word-details-card">
          <div class="word-details-card__section-header">
            <History class="w-5 h-5 text-purple-500" />
            <h4>Etymology</h4>
          </div>
          <div class="word-details-card__content">
            <p class="text-sm text-muted-foreground">{{ wordDetails!.etymology }}</p>
          </div>
        </div>

        <!-- Dictionary Actions -->
        <div class="word-details-sidebar__actions">
          <Button variant="outline" size="sm" class="word-details-sidebar__action-button">
            <Book class="w-4 h-4 mr-2" />
            Open in Dictionary
          </Button>
          <Button variant="outline" size="sm" class="word-details-sidebar__action-button">
            <Globe class="w-4 h-4 mr-2" />
            More Translations
          </Button>
        </div>
      </div>
    </ScrollArea>
  </div>
</template>

<style scoped>
.word-details-sidebar {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--color-border);
  background-color: var(--color-background);
  backdrop-filter: blur(8px);
}

.word-details-sidebar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
  background-color: color-mix(in srgb, var(--color-secondary) 30%, transparent);
}

.word-details-sidebar__title {
  font-size: 1.125rem;
  font-weight: 600;
}

.word-details-sidebar__close {
  padding: 0.25rem;
  height: auto;
  width: auto;
}

.word-details-sidebar__close:hover {
  background-color: var(--color-secondary);
}

.word-details-sidebar__content {
  flex: 1;
  padding: 1rem;
}

.word-details-sidebar__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}

.word-details-sidebar__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.word-details-sidebar__details {
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

.word-details-card {
  background-color: var(--color-card);
  color: var(--color-card-foreground);
  border-radius: 0.5rem;
  border: 1px solid var(--color-border);
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  padding: 1rem;
  transition: all 0.2s ease;
}

.word-details-card:hover {
  box-shadow: 0 4px 8px 0 rgb(0 0 0 / 0.1);
  border-color: color-mix(in srgb, var(--color-primary) 20%, var(--color-border));
}

.word-details-card__header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.word-details-card__word {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.word-details-card__pos {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 9999px;
  border: 1px solid;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.word-details-card__pos:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.word-details-card__lemma {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.word-details-card__section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid color-mix(in srgb, var(--color-border) 50%, transparent);
}

.word-details-card__section-header h4 {
  font-weight: 600;
  font-size: 1rem;
  color: var(--color-foreground);
}

.word-details-card__content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.word-details-card__list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.word-details-card__list-item {
  display: flex;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.word-details-card__list-number {
  font-weight: 600;
  min-width: 20px;
  color: var(--color-primary);
}

.word-details-card__example {
  padding: 0.75rem;
  border-radius: 0.25rem;
  border-left: 4px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
  background-color: color-mix(in srgb, var(--color-secondary) 50%, transparent);
  transition: all 0.2s ease;
  position: relative;
}

.word-details-card__example:hover {
  background-color: color-mix(in srgb, var(--color-secondary) 70%, transparent);
  transform: translateX(2px);
}

.word-details-sidebar__actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.word-details-sidebar__action-button {
  width: 100%;
  transition: all 0.2s ease;
}

.word-details-sidebar__action-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
