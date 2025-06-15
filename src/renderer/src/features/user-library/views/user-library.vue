<script setup lang="ts">
import { ref, useTemplateRef, onMounted, computed } from 'vue'
import SearchBar from '@renderer/common/components/SearchBar.vue'
import VDivider from '@renderer/common/components/ui/dividers/VDivider.vue'
import HDivider from '@renderer/common/components/ui/dividers/HDivider.vue'
import SortMenu from '@renderer/common/components/SortMenu.vue'
import { Button } from '@renderer/common/components/ui/button'
import ScrollArea from '@renderer/common/components/ui/scroll-area/ScrollArea.vue'
import LibraryMediaCard from '../components/LibraryMediaCard.vue'
import MediaCardContextMenu from '../components/MediaCardContextMenu.vue'
import LanguageFilter from '../components/filters/LanguageFilter.vue'
import TypeFilter from '../components/filters/TypeFilter.vue'
import ImportDialog from '../components/import/ImportDialog.vue'
import { useScrollPosition } from '@renderer/common/composables/useScrollPosition'
import { useTabRouter } from '@renderer/core/services/tabRouter'
import { storage } from '@renderer/core/services/service-container'
import {
  useMediaNavigation,
  type MediaItem as MediaNavigationItem
} from '../composables/useMediaNavigation'

import { LibraryItem } from '@shared/types/models'
import type { MediaItem } from '../types/media-item'

const tabRouter = useTabRouter()
const mediaNavigation = useMediaNavigation()
const scrollAreaRef = useTemplateRef<HTMLElement>('scrollAreaRef')

useScrollPosition(scrollAreaRef)
const open = ref(false)

// Context menu state
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  item: null as MediaItem | null
})

// Library state
const libraryItems = ref<LibraryItem[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

// Computed media items for display
const mediaItems = computed<MediaItem[]>(() => {
  return libraryItems.value.map((item: LibraryItem) => ({
    id: item.id,
    title: item.name || 'Untitled',
    subtitle: item.dynamicMetadata?.description || item.dynamicMetadata?.author || undefined,
    type: mapLibraryItemType(item.type),
    duration: item.dynamicMetadata?.duration,
    language: item.language,
    // Thumbnail will be loaded separately for each item
    thumbnail: undefined
  }))
})

// Map LibraryItem type to MediaItem type
function mapLibraryItemType(libraryType: string): MediaItem['type'] {
  switch (libraryType.toLowerCase()) {
    case 'video':
      return 'video'
    case 'audio':
      return 'audio'
    case 'collection':
      return 'collection'
    case 'article':
      return 'article'
    case 'document':
    default:
      return 'document'
  }
}

// Load library items from storage
const loadLibraryItems = async () => {
  isLoading.value = true
  error.value = null

  try {
    const items = await storage().getLibraryItems()
    libraryItems.value = items || []
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load library items'
    console.error('Error loading library items:', err)
  } finally {
    isLoading.value = false
  }
}

// Handle import from dialog
const handleImport = async (data: {
  source: FileList | string
  metadata: Partial<LibraryItem>
}) => {
  console.log('Import completed:', data)

  // Refresh the library items to show the newly imported item
  await loadLibraryItems()

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

// Handle context menu
const handleContextMenu = (item: MediaItem, event: MouseEvent) => {
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    item
  }
}

// Handle context menu actions
const handleContextMenuOpen = (item: MediaItem) => {
  handleCardClick(item)
}

const handleContextMenuDelete = async (item: MediaItem) => {
  try {
    const success = await storage().deleteLibraryItem(item.id)
    if (success) {
      await loadLibraryItems() // Refresh the list
      console.log(`Successfully deleted library item: ${item.title}`)
    } else {
      console.error('Failed to delete library item: No item was deleted')
    }
  } catch (error) {
    console.error('Failed to delete library item:', error)
    // You might want to show a toast notification or error dialog here
  }
}

const handleContextMenuClose = () => {
  contextMenu.value.visible = false
}

// Load library items on mount
onMounted(() => {
  loadLibraryItems()
})
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
      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center min-h-[200px]">
        <div class="text-center">
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"
          ></div>
          <p class="text-sm text-muted-foreground">Loading your library...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="flex justify-center items-center min-h-[200px]">
        <div class="text-center">
          <span class="icon-[solar--danger-triangle-bold] size-8 text-destructive mx-auto mb-2" />
          <p class="text-sm text-destructive mb-2">{{ error }}</p>
          <Button variant="outline" size="sm" @click="loadLibraryItems"> Try Again </Button>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="mediaItems.length === 0"
        class="flex justify-center items-center min-h-[200px]"
      >
        <div class="text-center">
          <span class="icon-[solar--folder-2-bold] size-12 text-muted-foreground mx-auto mb-4" />
          <h3 class="text-lg font-semibold mb-2">Your library is empty</h3>
          <p class="text-sm text-muted-foreground mb-4">
            Import your first media item to get started
          </p>
          <Button @click="open = true">
            <span class="icon-[solar--import-bold-duotone] mr-2" />
            Import Content
          </Button>
        </div>
      </div>

      <!-- Media Grid -->
      <div v-else class="faseeh-media-grid">
        <LibraryMediaCard
          v-for="item in mediaItems"
          :key="item.id"
          :item="item"
          @click="handleCardClick"
          @context-menu="handleContextMenu"
        />
      </div>
    </ScrollArea>
    <!-- Import Dialog -->
    <ImportDialog v-model:open="open" @import="handleImport" />

    <!-- Context Menu -->
    <MediaCardContextMenu
      :item="contextMenu.item"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :visible="contextMenu.visible"
      @open="handleContextMenuOpen"
      @delete="handleContextMenuDelete"
      @close="handleContextMenuClose"
    />
  </div>
</template>
