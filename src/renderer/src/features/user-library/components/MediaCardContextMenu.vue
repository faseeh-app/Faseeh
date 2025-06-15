<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import type { MediaItem } from '../types/media-item'

interface Props {
  item: MediaItem | null
  x: number
  y: number
  visible: boolean
}

interface Emits {
  (e: 'open', item: MediaItem): void
  (e: 'delete', item: MediaItem): void
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const menuRef = ref<HTMLDivElement>()

const handleOpen = () => {
  if (props.item) {
    emit('open', props.item)
    emit('close')
  }
}

const handleDelete = () => {
  if (props.item) {
    emit('delete', props.item)
    emit('close')
  }
}

const handleClickOutside = (event: MouseEvent) => {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    emit('close')
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    emit('close')
  }
}

// Add event listeners when menu becomes visible
const setupEventListeners = () => {
  if (props.visible) {
    nextTick(() => {
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('keydown', handleKeydown)
    })
  } else {
    document.removeEventListener('click', handleClickOutside)
    document.removeEventListener('keydown', handleKeydown)
  }
}

// Watch for visibility changes
watch(() => props.visible, setupEventListeners, { immediate: true })
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible && item"
      ref="menuRef"
      class="fixed z-50 min-w-[160px] bg-popover border border-border rounded-md shadow-md py-1"
      :style="{ left: `${x}px`, top: `${y}px` }"
    >
      <button
        class="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
        @click="handleOpen"
      >
        <span class="icon-[solar--play-bold] size-4" />
        Open
      </button>
      <div class="border-t border-border my-1"></div>
      <button
        class="w-full px-3 py-2 text-left text-sm hover:bg-destructive hover:text-destructive-foreground flex items-center gap-2 text-destructive"
        @click="handleDelete"
      >
        <span class="icon-[solar--trash-bin-trash-bold] size-4" />
        Delete
      </button>
    </div>
  </Teleport>
</template>
