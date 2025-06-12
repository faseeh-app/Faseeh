<script setup lang="ts">
import { computed, inject, ref, onUnmounted, type Ref, onMounted, watch } from 'vue'
import { Input } from '@renderer/common/components/ui/input'
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-vue-next'
import type { LibraryItem, MetadataScraperResult } from '@shared/types/types'
import { metadataRegistry } from '@renderer/core/faseeh-app'

const libraryItemForm = defineModel<Partial<LibraryItem>>({
  default: () => ({
    name: '',
    type: 'document',
    language: 'en',
    sourceUri: '',
    dynamicMetadata: {
      description: '',
      author: '',
      genre: '',
      tags: []
    }
  })
})

// Inject URL and files from parent
const urlInput = inject<Ref<string>>('urlInput')!
const selectedFiles = inject<Ref<FileList | null>>('selectedFiles')!

// Thumbnail state
const thumbnailUrl = ref<string | null>(null)
const hasThumbnail = computed(() => Boolean(thumbnailUrl.value))
const isLoading = ref(false)
const error = ref<string | null>(null)

// Function to fetch metadata from URL or file
const fetchMetadata = async (source: string | File) => {
  isLoading.value = true
  error.value = null

  try {
    const result = await metadataRegistry.scrapeMetadata(source)

    if (result.success && result.metadata) {
      // Update the form with scraped metadata
      if (result.metadata.name) {
        libraryItemForm.value.name = result.metadata.name
      }

      if (result.metadata.type) {
        console.log('Setting type to:', result.metadata.type)
        libraryItemForm.value.type = result.metadata.type
      }

      if (result.metadata.language) {
        libraryItemForm.value.language = result.metadata.language
      }

      // Handle thumbnail if available
      if (result.metadata.thumbnail) {
        handleThumbnailFromMetadata(result.metadata.thumbnail)
      }

      // Update dynamic metadata
      if (result.metadata.dynamicMetadata) {
        libraryItemForm.value.dynamicMetadata = {
          ...libraryItemForm.value.dynamicMetadata,
          ...result.metadata.dynamicMetadata
        }
      }
    } else {
      error.value = 'Failed to retrieve metadata'
    }
  } catch (err) {
    error.value = 'Error fetching metadata'
  } finally {
    isLoading.value = false
  }
}

// Handle a thumbnail file from metadata
const handleThumbnailFromMetadata = (thumbnail: File) => {
  libraryItemForm.value.thumbnail = thumbnail

  // Create an object URL for the thumbnail file
  if (thumbnailUrl.value) {
    URL.revokeObjectURL(thumbnailUrl.value)
  }
  thumbnailUrl.value = URL.createObjectURL(thumbnail)
}

// Watch for URL or file changes
watch(urlInput, async (newUrl) => {
  if (newUrl.trim()) {
    await fetchMetadata(newUrl)
  }
})

watch(selectedFiles, async (newFiles) => {
  if (newFiles && newFiles.length > 0) {
    await fetchMetadata(newFiles[0])
  }
})

// Cleanup on unmount
onUnmounted(() => {
  if (thumbnailUrl.value) {
    URL.revokeObjectURL(thumbnailUrl.value)
  }
})

// Handle thumbnail file selection
const fileInputRef = ref<HTMLInputElement>()

const handleThumbnailSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file && file.type.startsWith('image/')) {
    libraryItemForm.value.thumbnail = file

    // Revoke previous URL if exists
    if (thumbnailUrl.value) {
      URL.revokeObjectURL(thumbnailUrl.value)
    }

    thumbnailUrl.value = URL.createObjectURL(file)
  }
}

// Trigger file input click
const triggerThumbnailSelect = () => {
  fileInputRef.value?.click()
}

// Language options
const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'Arabic' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' }
]

// Type options
const typeOptions = [
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
  { value: 'document', label: 'Document' },
  { value: 'book', label: 'Book' },
  { value: 'article', label: 'Article' },
  { value: 'webpage', label: 'Webpage' }
]

// Safe computed properties for form fields
const safeDescription = computed({
  get: () => libraryItemForm.value.dynamicMetadata?.description || '',
  set: (value: string) => {
    if (!libraryItemForm.value.dynamicMetadata) {
      libraryItemForm.value.dynamicMetadata = {}
    }
    libraryItemForm.value.dynamicMetadata.description = value
  }
})

onMounted(() => {
  if (urlInput.value?.trim()) {
    fetchMetadata(urlInput.value)
  } else if (selectedFiles.value && selectedFiles.value.length > 0) {
    fetchMetadata(selectedFiles.value[0])
  }
})
</script>

<template>
  <div class="faseeh-media-details">
    <!-- Thumbnail Column -->
    <div class="faseeh-media-details__thumbnail-column">
      <div
        class="faseeh-media-details__thumbnail-container"
        :class="{
          'faseeh-media-details__thumbnail-container--loading': isLoading,
          'faseeh-media-details__thumbnail-container--error': error
        }"
        @click="triggerThumbnailSelect"
      >
        <!-- Loading State -->
        <div v-if="isLoading" class="faseeh-media-details__thumbnail-loading">
          <Loader2 class="faseeh-media-details__loading-icon" />
        </div>

        <!-- Thumbnail Display -->
        <div v-else-if="hasThumbnail && thumbnailUrl" class="faseeh-media-details__thumbnail-image">
          <img :src="thumbnailUrl" alt="Thumbnail" />
          <div class="faseeh-media-details__thumbnail-overlay">
            <Upload class="faseeh-media-details__upload-icon" />
            <span>Click to change</span>
          </div>
        </div>

        <!-- Placeholder -->
        <div v-else class="faseeh-media-details__thumbnail-placeholder">
          <ImageIcon class="faseeh-media-details__placeholder-icon" />
          <span>Click to select thumbnail</span>
        </div>
      </div>

      <!-- Hidden file input -->
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        style="display: none"
        @change="handleThumbnailSelect"
      />
    </div>

    <!-- Form Column -->
    <div class="faseeh-media-details__form-column">
      <div class="faseeh-media-details__form">
        <!-- Title -->
        <div class="faseeh-media-details__field">
          <label class="faseeh-media-details__label">Title *</label>
          <Input v-model="libraryItemForm.name" placeholder="Enter media title" required />
        </div>

        <!-- Type -->
        <div class="faseeh-media-details__field">
          <label class="faseeh-media-details__label">Type</label>
          <select v-model="libraryItemForm.type" class="faseeh-media-details__select">
            <option v-for="option in typeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <!-- Language -->
        <div class="faseeh-media-details__field">
          <label class="faseeh-media-details__label">Language</label>
          <select v-model="libraryItemForm.language" class="faseeh-media-details__select">
            <option v-for="option in languageOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <!-- Description -->
        <div class="faseeh-media-details__field">
          <label class="faseeh-media-details__label">Description</label>
          <textarea
            v-model="safeDescription"
            placeholder="Enter description (optional)"
            class="faseeh-media-details__textarea"
            rows="4"
          ></textarea>
        </div>
      </div>
    </div>
  </div>
</template>
