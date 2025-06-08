<script setup lang="ts">
// Changed to script setup
import SearchBar from '@renderer/common/components/ui/SearchBar.vue'
import VDivider from '@renderer/common/components/ui/dividers/VDivider.vue'
import HDivider from '@renderer/common/components/ui/dividers/HDivider.vue'
import SortMenu from '@renderer/common/components/ui/SortMenu.vue'
import { Button } from '@renderer/common/components/ui/button'
import ScrollArea from '@renderer/common/components/ui/scroll-area/ScrollArea.vue'
import MediaCard from '@renderer/common/components/ui/MediaCard.vue'
import LanguageFilter from '../components/filters/LanguageFilter.vue'
import TypeFilter from '../components/filters/TypeFilter.vue'
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import videoThumbnail from '@renderer/common/assets/images/yt_video_thumbnail_1.webp'
import playlistThumbnail from '@renderer/common/assets/images/yt_playlist_thumbnail_1.webp'
import bookCover1 from '@renderer/common/assets/images/book_cover_1.webp'
import bookCover2 from '@renderer/common/assets/images/book_cover_2.webp'

const route = useRoute()

const visitCount = ref(0)
const lastVisitTime = ref<string>('')

// Sample media data
const mediaItems = ref([
  {
    id: '1',
    title: 'Introduction to Arabic Grammar',
    subtitle: 'Learn the fundamentals of Arabic grammar',
    type: 'video' as const,
    duration: '45:30',
    language: 'ar',
    thumbnail: videoThumbnail
  },
  {
    id: '2',
    title: 'Understanding Arabic Poetry',
    subtitle: 'A deep dive into classical Arabic poetry',
    type: 'collection' as const,
    duration: '30:15',
    thumbnail: playlistThumbnail
  },
  {
    id: '3',
    title: 'Arabic Literature Classics',
    subtitle: 'A collection of classic Arabic literature',
    type: 'document' as const,
    thumbnail: bookCover1
  },
  {
    id: '4',
    title: 'Modern Arabic Novels',
    subtitle: 'Exploring contemporary Arabic novels',
    type: 'document' as const,
    thumbnail: bookCover2
  },
  {
    id: '5',
    title: 'Arabic Calligraphy Techniques',
    type: 'document' as const
  }
])

// Computed properties based on route queries
const currentContext = computed(() => {
  const filter = route.query.filter as string
  const type = route.query.type as string

  if (filter) return `Filter: ${filter}`
  if (type) return `Type: ${type}`
  return 'All Content'
})

// Record visit when component mounts
onMounted(() => {
  visitCount.value += 1
  lastVisitTime.value = new Date().toLocaleTimeString()

  console.log(`[Library Tab] Mounted with context:`, currentContext.value)
  console.log(`[Library Tab] Visit count:`, visitCount.value)
})
</script>
<template>
  <div class="flex flex-col">
    <div class="flex items-center py-3 px-6 space-x-1.5">
      <SearchBar />
      <SortMenu />
      <VDivider />
      <Button class="">
        <span class="icon-[solar--import-bold-duotone] size-7" />
        Import
      </Button>
    </div>
    <div class="flex p-4 space-x-1.5">
      <LanguageFilter />
      <TypeFilter />
    </div>
    <HDivider />
    <ScrollArea class="flex-grow h-1">
      <div class="faseeh-media-grid">
        <MediaCard v-for="item in mediaItems" :key="item.id" :item="item" />
      </div>
    </ScrollArea>
  </div>
</template>
