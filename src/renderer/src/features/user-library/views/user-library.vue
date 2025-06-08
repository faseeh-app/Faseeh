<script setup lang="ts">
import SearchBar from '@renderer/common/components/ui/SearchBar.vue'
import VDivider from '@renderer/common/components/ui/dividers/VDivider.vue'
import HDivider from '@renderer/common/components/ui/dividers/HDivider.vue'
import SortMenu from '@renderer/common/components/ui/SortMenu.vue'
import { Button } from '@renderer/common/components/ui/button'
import ScrollArea from '@renderer/common/components/ui/scroll-area/ScrollArea.vue'
import MediaCard from '@renderer/common/components/ui/MediaCard.vue'
import LanguageFilter from '../components/filters/LanguageFilter.vue'
import TypeFilter from '../components/filters/TypeFilter.vue'
import { ref, useTemplateRef } from 'vue'
import { useScrollPosition } from '@renderer/common/composables/useScrollPosition'
import videoThumbnail from '@renderer/common/assets/images/yt_video_thumbnail_1.webp'
import playlistThumbnail from '@renderer/common/assets/images/yt_playlist_thumbnail_1.webp'
import bookCover1 from '@renderer/common/assets/images/book_cover_1.webp'
import bookCover2 from '@renderer/common/assets/images/book_cover_2.webp'

interface MediaItem {
  id: string
  title: string
  subtitle?: string
  type: 'video' | 'collection' | 'document'
  duration?: string
  language?: string
  thumbnail?: string
}

const scrollAreaRef = useTemplateRef<HTMLElement>('scrollAreaRef')

useScrollPosition(scrollAreaRef)

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
  <div class="flex flex-col">
    <!-- Search & Import Controls -->
    <div class="flex items-center py-3 px-6 space-x-1.5">
      <SearchBar />
      <SortMenu />
      <VDivider />
      <Button>
        <span class="icon-[solar--import-bold-duotone] size-7" />
        Import
      </Button>
    </div>

    <!-- Filters -->
    <div class="flex p-4 space-x-1.5">
      <LanguageFilter />
      <TypeFilter />
    </div>
    <HDivider />
    <!-- Content Area -->
    <ScrollArea ref="scrollAreaRef" class="flex-grow h-1">
      <div class="faseeh-media-grid">
        <MediaCard v-for="item in mediaItems" :key="item.id" :item="item" />
      </div>
    </ScrollArea>
  </div>
</template>
