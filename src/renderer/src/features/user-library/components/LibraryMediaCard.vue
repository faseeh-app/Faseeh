<script setup lang="ts">
import { computed } from 'vue'
import MediaCard from '@renderer/common/components/MediaCard.vue'
import { useThumbnail } from '@renderer/common/composables/useThumbnail'
import type { MediaItem } from '../types/media-item'

interface Props {
  item: MediaItem
}

interface Emits {
  (e: 'click', item: MediaItem, event: MouseEvent): void
  (e: 'context-menu', item: MediaItem, event: MouseEvent): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Load thumbnail for the library item
const { thumbnailUrl } = useThumbnail(props.item.id)

// Create a computed item with the loaded thumbnail
const itemWithThumbnail = computed(() => ({
  ...props.item,
  thumbnail: thumbnailUrl.value || undefined
}))

const handleCardClick = (item: MediaItem, event: MouseEvent) => {
  emit('click', item, event)
}

const handleContextMenu = (item: MediaItem, event: MouseEvent) => {
  emit('context-menu', item, event)
}
</script>

<template>
  <MediaCard :item="itemWithThumbnail" @click="handleCardClick" @context-menu="handleContextMenu" />
</template>
