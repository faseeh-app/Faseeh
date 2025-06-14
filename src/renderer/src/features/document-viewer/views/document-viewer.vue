<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@renderer/common/components/ui/button'
import { ScrollArea } from '@renderer/common/components/ui/scroll-area'
import { Separator } from '@renderer/common/components/ui/separator'
import { RouteNames } from '@renderer/common/router/routes'
import WordDetailsSidebar from '../components/WordDetailsSidebar.vue'
import { ChevronLeft, BookOpen, Languages } from 'lucide-vue-next'

const router = useRouter()

interface WordDetails {
  word: string
  lemma: string
  translation: string
  partOfSpeech: string
  definitions: string[]
  examples: string[]
  etymology?: string
}

interface DocumentChapter {
  id: string
  title: string
  content: string
}

// Sample document data
const document = ref({
  title: 'Introduction to Modern Literature',
  author: 'Dr. Sarah Johnson',
  language: 'English',
  chapters: [
    {
      id: 'ch1',
      title: 'Chapter 1: The Evolution of Modern Writing',
      content: `In the beginning was the word, and the word was powerful beyond measure. This profound opening reminds us of the fundamental importance of language in our intellectual and spiritual lives.

The English language, with its rich tapestry of influences and expressions, stands as one of humanity's greatest achievements in communication. This magnificent linguistic tool has served as the vessel for some of the most transformative literary and philosophical works throughout history.

In this chapter, we will explore the beauty of modern literature, from the revolutionary works of the early 20th century to the digital age of contemporary writing. We will learn how authors have captured the essence of human experience, from love and conflict to nature and wisdom.

The great works of modernist literature represent some of the finest achievements in literary history. These groundbreaking texts revolutionized how we think about narrative, consciousness, and the very nature of reality itself.`
    },
    {
      id: 'ch2',
      title: 'Chapter 2: Contemporary Literary Movements',
      content: `Contemporary literature has witnessed remarkable developments since the mid-20th century. This evolution has emerged from the intersection of global cultures and innovative approaches to storytelling and thematic exploration.

Writers like Toni Morrison, Salman Rushdie, and Gabriel García Márquez have become icons of contemporary literature. Their novels capture the human condition with unprecedented depth and complexity, addressing crucial social and political issues of our time.

Maya Angelou, one of the most influential voices in American literature, contributed significantly to our understanding of identity, resilience, and the power of personal narrative. Her autobiographical works transformed how we approach memoir and self-reflection in literature.`
    }
  ] as DocumentChapter[]
})

const selectedWord = ref<WordDetails | null>(null)
const isSidebarOpen = ref(true)
const isLoading = ref(false)

// Mock highlighted words with their details
const highlightedWords = new Map<string, WordDetails>([
  ['language', {
    word: 'language',
    lemma: 'language',
    translation: 'a system of communication',
    partOfSpeech: 'noun',
    definitions: [
      'A system of communication used by humans consisting of words and rules',
      'The method of human communication, either spoken or written',
      'A particular style of speaking or writing'
    ],
    examples: [
      'English is a beautiful language',
      'She speaks several languages fluently',
      'The language of poetry is expressive'
    ],
    etymology: 'From Old French "language", from Latin "lingua" meaning "tongue"'
  }],
  ['literature', {
    word: 'literature',
    lemma: 'literature',
    translation: 'written works of artistic value',
    partOfSpeech: 'noun',
    definitions: [
      'Written works, especially those considered of superior or lasting artistic merit',
      'Books and writings published on a particular subject',
      'The body of written works produced in a particular language, country, or age'
    ],
    examples: [
      'She studied English literature at university',
      'The literature of the Renaissance period',
      'Medical literature on the subject'
    ],
    etymology: 'From Latin "litteratura" meaning "writing formed with letters"'
  }],
  ['writing', {
    word: 'writing',
    lemma: 'write',
    translation: 'the activity of creating text',
    partOfSpeech: 'noun',
    definitions: [
      'The activity or skill of marking coherent words on paper',
      'The work or style of a particular author',
      'Something that has been written'
    ],
    examples: [
      'Creative writing is an art form',
      'Her writing style is elegant',
      'The writing on the wall was clear'
    ],
    etymology: 'From Old English "writan" meaning "to score, outline, draw"'
  }],
  ['narrative', {
    word: 'narrative',
    lemma: 'narrative',
    translation: 'a spoken or written account',
    partOfSpeech: 'noun',
    definitions: [
      'A spoken or written account of connected events; a story',
      'The practice or art of telling stories',
      'A representation of a particular situation or process'
    ],
    examples: [
      'The narrative structure of the novel',
      'Personal narrative in autobiography',
      'Historical narrative of events'
    ],
    etymology: 'From Latin "narrativus" meaning "telling a story"'
  }]
])

const processedContent = computed(() => {
  return document.value.chapters.map(chapter => ({
    ...chapter,
    content: highlightWords(chapter.content)
  }))
})

function highlightWords(text: string): string {
  let highlightedText = text

  for (const [word] of highlightedWords) {
    const regex = new RegExp(word, 'g')
    highlightedText = highlightedText.replace(
      regex,
      `<span class="highlighted-word" data-word="${word}">${word}</span>`
    )
  }

  return highlightedText
}

function handleWordClick(event: Event) {
  const target = event.target as HTMLElement
  if (target.classList.contains('highlighted-word')) {
    const word = target.dataset.word
    if (word && highlightedWords.has(word)) {
      isLoading.value = true
      // Simulate loading for better UX
      setTimeout(() => {
        selectedWord.value = highlightedWords.get(word)!
        isSidebarOpen.value = true
        isLoading.value = false
      }, 200)
    }
  }
}

function closeSidebar() {
  isSidebarOpen.value = false
  selectedWord.value = null
}

function goBack() {
  // Navigate back to library
  router.push({ name: RouteNames.LIBRARY })
}
</script>

<template>
  <div class="document-viewer">
    <!-- Header -->
    <div class="document-viewer__header">
      <Button variant="ghost" size="sm" @click="goBack" class="document-viewer__back-button">
        <ChevronLeft class="w-4 h-4 mr-2" />
        Back to Library
      </Button>

      <div class="document-viewer__document-info">
        <div class="document-viewer__document-title">
          <BookOpen class="w-5 h-5 mr-2 text-primary" />
          {{ document.title }}
        </div>
        <div class="document-viewer__document-meta">
          <span>{{ document.author }}</span>
          <Separator orientation="vertical" class="h-4" />
          <span class="flex items-center">
            <Languages class="w-4 h-4 mr-1" />
            {{ document.language }}
          </span>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        @click="isSidebarOpen = !isSidebarOpen"
        class="document-viewer__sidebar-toggle"
      >
        {{ isSidebarOpen ? 'Hide' : 'Show' }} Details
      </Button>
    </div>

    <Separator />

    <!-- Main Content -->
    <div class="document-viewer__main" :class="{ 'document-viewer__main--sidebar-open': isSidebarOpen }">
      <!-- Document Content -->
      <div class="document-viewer__content">
        <ScrollArea class="document-viewer__scroll-area">
          <div class="document-viewer__document">
            <div
              v-for="chapter in processedContent"
              :key="chapter.id"
              class="document-viewer__chapter"
            >
              <h2 class="document-viewer__chapter-title">{{ chapter.title }}</h2>
              <div
                class="document-viewer__chapter-content"
                v-html="chapter.content"
                @click="handleWordClick"
              ></div>
            </div>
          </div>
        </ScrollArea>
      </div>

      <!-- Word Details Sidebar -->
      <Transition name="sidebar">
        <WordDetailsSidebar
          v-if="isSidebarOpen"
          class="document-viewer__sidebar"
          :word-details="selectedWord"
          :is-loading="isLoading"
          @close="closeSidebar"
        />
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.document-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-background);
  color: var(--color-foreground);
}

.document-viewer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
  background-color: color-mix(in srgb, var(--color-card) 80%, transparent);
  backdrop-filter: blur(8px);
  gap: 1rem;
  min-height: 64px;
}

.document-viewer__back-button {
  color: var(--color-muted-foreground);
}

.document-viewer__back-button:hover {
  color: var(--color-foreground);
}

.document-viewer__document-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.document-viewer__document-title {
  display: flex;
  align-items: center;
  font-size: 1.125rem;
  font-weight: 600;
}

.document-viewer__document-meta {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  color: var(--color-muted-foreground);
}

.document-viewer__sidebar-toggle {
  min-width: 100px;
}

.document-viewer__main {
  display: flex;
  flex: 1;
  overflow: hidden;
  transition: all 0.3s ease;
}

.document-viewer__main--sidebar-open {
  display: grid;
  grid-template-columns: 1fr 400px;
}

@media (max-width: 768px) {
  .document-viewer__main--sidebar-open {
    grid-template-columns: 1fr;
  }
  
  .document-viewer__sidebar {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-width: 400px;
    z-index: 50;
    box-shadow: -4px 0 8px rgba(0, 0, 0, 0.1);
  }
}

.document-viewer__content {
  flex: 1;
  overflow: hidden;
}

.document-viewer__scroll-area {
  height: 100%;
}

.document-viewer__document {
  max-width: 64rem;
  margin: 0 auto;
  padding: 2rem;
  background-color: color-mix(in srgb, var(--color-card) 60%, transparent);
  border-radius: 0.75rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.document-viewer__chapter {
  margin-bottom: 3rem;
}

.document-viewer__chapter-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.5rem;
  color: var(--color-primary);
  position: relative;
}

.document-viewer__chapter-title::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 3rem;
  height: 2px;
  background: linear-gradient(90deg, var(--color-primary), transparent);
  border-radius: 1px;
}

.document-viewer__chapter-content {
  font-size: 1.125rem;
  line-height: 2;
  text-align: justify;
  color: var(--color-foreground);
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.document-viewer__chapter-content :deep(p) {
  margin-bottom: 1rem;
}

.document-viewer__chapter-content :deep(.highlighted-word) {
  background-color: color-mix(in srgb, var(--color-primary) 15%, transparent);
  border-bottom: 2px solid var(--color-primary);
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
  font-weight: 500;
  position: relative;
  display: inline-block;
}

.document-viewer__chapter-content :deep(.highlighted-word):hover {
  background-color: color-mix(in srgb, var(--color-primary) 25%, transparent);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 0 0 2px color-mix(in srgb, var(--color-primary) 20%, transparent);
}

.document-viewer__chapter-content :deep(.highlighted-word):active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.document-viewer__sidebar {
  border-left: 1px solid var(--color-border);
  background-color: var(--color-background);
}

/* Sidebar transition */
.sidebar-enter-active,
.sidebar-leave-active {
  transition: all 0.3s ease;
}

.sidebar-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.sidebar-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
