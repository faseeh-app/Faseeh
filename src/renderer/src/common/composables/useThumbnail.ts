import { ref, computed, onMounted, onUnmounted } from 'vue'
import { storage } from '@renderer/core/services/service-container'

/**
 * Composable for managing thumbnail display and loading for library items
 *
 * @param libraryItemId - The ID of the library item to load thumbnail for
 */
export function useThumbnail(libraryItemId: string) {
  const thumbnailUrl = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const hasThumbnail = computed(() => Boolean(thumbnailUrl.value))

  const loadThumbnail = async () => {
    if (!libraryItemId) return

    isLoading.value = true
    error.value = null

    try {
      const url = await storage().getThumbnailUrl(libraryItemId)
      thumbnailUrl.value = url
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load thumbnail'
      console.error('Error loading thumbnail:', err)
    } finally {
      isLoading.value = false
    }
  }

  const saveThumbnail = async (thumbnailFile: File) => {
    isLoading.value = true
    error.value = null

    try {
      const success = await storage().saveThumbnail(libraryItemId, thumbnailFile)
      if (success) {
        // Reload thumbnail URL after successful save
        await loadThumbnail()
      } else {
        error.value = 'Failed to save thumbnail'
      }
      return success
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to save thumbnail'
      console.error('Error saving thumbnail:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const deleteThumbnail = async () => {
    isLoading.value = true
    error.value = null

    try {
      const success = await storage().deleteThumbnail(libraryItemId)
      if (success) {
        thumbnailUrl.value = null
      }
      return success
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete thumbnail'
      console.error('Error deleting thumbnail:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const refreshThumbnail = () => {
    loadThumbnail()
  }

  onMounted(() => {
    loadThumbnail()
  })

  onUnmounted(() => {
    // Cleanup any resources if needed
    thumbnailUrl.value = null
  })

  return {
    thumbnailUrl,
    isLoading,
    error,
    hasThumbnail,
    loadThumbnail,
    saveThumbnail,
    deleteThumbnail,
    refreshThumbnail
  }
}
