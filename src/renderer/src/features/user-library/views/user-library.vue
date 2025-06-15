<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import SearchBar from '@renderer/common/components/SearchBar.vue'
import VDivider from '@renderer/common/components/ui/dividers/VDivider.vue'
import HDivider from '@renderer/common/components/ui/dividers/HDivider.vue'
import SortMenu from '@renderer/common/components/SortMenu.vue'
import { Button } from '@renderer/common/components/ui/button'
import ScrollArea from '@renderer/common/components/ui/scroll-area/ScrollArea.vue'
import MediaCard from '@renderer/common/components/MediaCard.vue'
import LanguageFilter from '../components/filters/LanguageFilter.vue'
import TypeFilter from '../components/filters/TypeFilter.vue'
import ImportDialog from '../components/import/ImportDialog.vue'
import { useScrollPosition } from '@renderer/common/composables/useScrollPosition'
import { useTabRouter } from '@renderer/common/services/tabRouter'
import {
  useMediaNavigation,
  type MediaItem as MediaNavigationItem
} from '../composables/useMediaNavigation'
import videoThumbnail from '@renderer/common/assets/images/yt_video_thumbnail_1.webp'
import playlistThumbnail from '@renderer/common/assets/images/yt_playlist_thumbnail_1.webp'
import bookCover1 from '@renderer/common/assets/images/book_cover_1.webp'
import bookCover2 from '@renderer/common/assets/images/book_cover_2.webp'

import { LibraryItem } from '@shared/types/models'

interface MediaItem {
  id: string
  title: string
  subtitle?: string
  type: 'video' | 'audio' | 'document' | 'collection' | 'article'
  duration?: string
  language?: string
  thumbnail?: string
}

const tabRouter = useTabRouter()
const mediaNavigation = useMediaNavigation()
const scrollAreaRef = useTemplateRef<HTMLElement>('scrollAreaRef')

useScrollPosition(scrollAreaRef)
const open = ref(false)

// Handle import from dialog
const handleImport = (data: { source: FileList | string; metadata: Partial<LibraryItem> }) => {
  // TODO: Implement actual import logic using manual import service
  console.log('Importing:', data)

  // Close dialog
  open.value = false
}

// Handle media card click with the new MediaLayout navigation
const handleCardClick = async (item: MediaItem, event?: MouseEvent) => {
  // For collection types, stay in library for now
  if (item.type === 'collection' || item.type === 'audio') {
    console.log('Collection/Audio navigation not implemented yet')
    return
  }

  // Convert to MediaNavigationItem format
  const mediaItem: MediaNavigationItem = {
    id: item.id,
    title: item.title,
    type: item.type === 'video' ? 'video' : 'document'
  }

  try {
    await mediaNavigation.openMediaWithModifiers(mediaItem, event)
  } catch (error) {
    console.error('Failed to navigate to media:', error)
  }
}

// Sample media items data
const mediaItems = ref<MediaItem[]>([
  {
    id: '1',
    title: 'Introduction to Arabic Grammar',
    subtitle: 'Learn the fundamentals of Arabic grammar',
    type: 'video',
    duration: '45:30',
    language: 'ar',
    thumbnail: videoThumbnail
  },
  {
    id: '2',
    title: 'Understanding Arabic Poetry',
    subtitle: 'A deep dive into classical Arabic poetry',
    type: 'collection',
    duration: '30:15',
    thumbnail: playlistThumbnail
  },
  {
    id: '3',
    title: 'Arabic Literature Classics',
    subtitle: 'A collection of classic Arabic literature',
    type: 'document',
    thumbnail: bookCover1
  },
  {
    id: '4',
    title: 'Modern Arabic Novels',
    subtitle: 'Exploring contemporary Arabic novels',
    type: 'document',
    thumbnail: bookCover2
  },
  {
    id: '5',
    title: 'Arabic Calligraphy Techniques',
    type: 'document'
  }
])
</script>

<template>
  <div class="faseeh-user-library">
    <!-- Search & Import Controls -->
    <div class="faseeh-user-library__header">
      <Button
        v-if="tabRouter.canGoBack"
        variant="ghost"
        size="sm"
        @click="tabRouter.back()"
        class="mr-2"
      >
        <span class="icon-[solar--arrow-left-linear] mr-1" />
        Back
      </Button>
      <SearchBar />
      <SortMenu />
      <VDivider />
      <Button @click="open = true">
        <span class="icon-[solar--import-bold-duotone] faseeh-user-library__import-button-icon" />
        Import
      </Button>
    </div>

    <!-- Filters -->
    <div class="faseeh-user-library__filters">
      <LanguageFilter />
      <TypeFilter />
    </div>
    <HDivider />
    <!-- Content Area -->
    <ScrollArea ref="scrollAreaRef" class="faseeh-user-library__content">
      <div class="faseeh-media-grid">
        <MediaCard
          v-for="item in mediaItems"
          :key="item.id"
          :item="item"
          @click="(item, event) => handleCardClick(item, event)"
        />
      </div>
    </ScrollArea>
    <!-- Import Dialog -->
    <ImportDialog v-model:open="open" @import="handleImport" />
  </div>
</template>
