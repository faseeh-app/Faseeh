<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import SearchBar from '@renderer/common/components/ui/SearchBar.vue'
import VDivider from '@renderer/common/components/ui/dividers/VDivider.vue'
import HDivider from '@renderer/common/components/ui/dividers/HDivider.vue'
import SortMenu from '@renderer/common/components/ui/SortMenu.vue'
import { Button } from '@renderer/common/components/ui/button'
import ScrollArea from '@renderer/common/components/ui/scroll-area/ScrollArea.vue'
import MediaCard from '@renderer/common/components/ui/MediaCard.vue'
import LanguageFilter from '../components/filters/LanguageFilter.vue'
import TypeFilter from '../components/filters/TypeFilter.vue'
import ImportDialog from '../components/import/ImportDialog.vue'
import { useScrollPosition } from '@renderer/common/composables/useScrollPosition'
import { RouteNames } from '@renderer/common/router/routes'
import videoThumbnail from '@renderer/common/assets/images/yt_video_thumbnail_1.webp'
import playlistThumbnail from '@renderer/common/assets/images/yt_playlist_thumbnail_1.webp'
import bookCover1 from '@renderer/common/assets/images/book_cover_1.webp'
import bookCover2 from '@renderer/common/assets/images/book_cover_2.webp'

import { LibraryItem } from '@shared/types/models'

interface MediaItem {
  id: string
  title: string
  subtitle?: string
  type: 'video' | 'collection' | 'document'
  duration?: string
  language?: string
  thumbnail?: string
}

interface LibraryItemForm {
  name: string
  type: 'video' | 'audio' | 'document' | 'book' | 'article' | 'webpage'
  language: string
  sourceUri: string
  dynamicMetadata: {
    description?: string
    author?: string
    genre?: string
    tags?: string[]
  }
  thumbnail?: File | string
}

const router = useRouter()
const scrollAreaRef = useTemplateRef<HTMLElement>('scrollAreaRef')

useScrollPosition(scrollAreaRef)
const open = ref(true)

// Handle import from dialog
const handleImport = (data: { source: FileList | string; metadata: LibraryItemForm }) => {
  // TODO: Implement actual import logic using manual import service
  console.log('Importing:', data)

  // Close dialog
  open.value = false
}

// Handle media card click
const handleCardClick = (item: MediaItem) => {
  if (item.type === 'document') {
    // Navigate to document viewer
    router.push({ name: RouteNames.DOCUMENT_VIEWER, params: { id: item.id } })
  } else if (item.type === 'video') {
    // Navigate to video player
    router.push({ name: RouteNames.VIDEO_PLAYER, params: { id: item.id } })
  } else {
    // Handle other media types (audio, collection, etc.)
    console.log('Opening media:', item)
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
    <HDivider />    <!-- Content Area -->
    <ScrollArea ref="scrollAreaRef" class="faseeh-user-library__content">
      <div class="faseeh-media-grid">
        <MediaCard
          v-for="item in mediaItems"
          :key="item.id"
          :item="item"
          @click="handleCardClick"
        />
      </div>
    </ScrollArea>
    <!-- Import Dialog -->
    <ImportDialog v-model:open="open" @import="handleImport" />
  </div>
</template>
