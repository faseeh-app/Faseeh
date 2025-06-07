<script setup lang="ts">
interface MediaItem {
  id: string
  title: string
  subtitle?: string
  thumbnail?: string
  type: 'video' | 'audio' | 'document' | 'collection' | 'article'
  duration?: string
  language?: string
}

interface Props {
  item: MediaItem
}

const props = defineProps<Props>()

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'video':
      return 'icon-[solar--video-frame-play-horizontal-bold]'
    case 'audio':
      return 'icon-[solar--music-note-2-bold]'
    case 'document':
      return 'icon-[solar--document-text-bold]'
    case 'article':
      return 'icon-[solar--notes-bold]'
    case 'collection':
      return 'icon-[solar--folder-bold]'
    default:
      return 'icon-[solar--file-bold]'
  }
}

const getCardClass = (type: string) => {
  switch (type) {
    case 'audio':
      return 'faseeh-media-card--audio'
    case 'document':
      return 'faseeh-media-card--document'
    case 'collection':
      return 'faseeh-media-card--collection'
    default:
      return 'faseeh-media-card--video'
  }
}

const handleCardClick = () => {
  console.log('Card clicked:', props.item.id)
}
</script>

<template>
  <div
    :class="getCardClass(item.type)"
    @click="handleCardClick"
    role="button"
    tabindex="0"
    :aria-label="`Open ${item.title}`"
  >
    <img
      v-if="item.thumbnail"
      :src="item.thumbnail"
      :alt="item.title"
      class="faseeh-media-card__thumbnail"
      loading="lazy"
    />
    <div v-else class="faseeh-media-card__placeholder">
      <span :class="[getTypeIcon(item.type), 'size-12 opacity-50']" />
    </div>

    <div class="faseeh-media-card__overlay" />

    <div class="faseeh-media-card__type-badge">
      {{ item.type.charAt(0).toUpperCase() + item.type.slice(1) }}
    </div>

    <div class="faseeh-media-card__info">
      <h3 class="faseeh-media-card__title">{{ item.title }}</h3>
      <p v-if="item.subtitle" class="faseeh-media-card__subtitle">
        {{ item.subtitle }}
      </p>
      <div v-if="item.duration || item.language" class="flex justify-between items-center mt-1">
        <span v-if="item.duration" class="text-xs text-white/70">
          {{ item.duration }}
        </span>
        <span v-if="item.language" class="text-xs text-white/70 uppercase">
          {{ item.language }}
        </span>
      </div>
    </div>
  </div>
</template>
