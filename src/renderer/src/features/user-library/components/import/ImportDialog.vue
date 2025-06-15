<script setup lang="ts">
import { ref, computed, reactive, watch, provide } from 'vue'
import { createReusableTemplate, useMediaQuery } from '@vueuse/core'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@renderer/common/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle
} from '@renderer/common/components/ui/drawer'
import { Button } from '@renderer/common/components/ui/button'
import MediaSelectionStep from './MediaSelectionStep.vue'
import MediaDetailsStep from './MediaDetailsStep.vue'
import ImportProgressStep from './ImportProgressStep.vue'
import { contentRegistry, storage } from '@renderer/core/services/service-container'
import type { LibraryItem } from '@shared/types/types'

interface Emits {
  (e: 'import', data: { source: FileList | string; metadata: Partial<LibraryItem> }): void
}
const emit = defineEmits<Emits>()

const isOpen = defineModel<boolean>('open', { default: false })
const isDesktop = useMediaQuery('(min-width: 768px)')

const [UseImportTemplate, ImportContent] = createReusableTemplate()

const currentStep = ref(1)
const urlInput = ref('')
const selectedFiles = ref<FileList | null>(null)

const libraryItemForm = reactive<Partial<LibraryItem>>({
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

const steps = [
  {
    step: 1,
    title: 'Select Media',
    description: 'Select a media source to import'
  },
  {
    step: 2,
    title: 'Edit Media Details',
    description: 'Edit the details of the media you are importing'
  },
  {
    step: 3,
    title: 'Processing',
    description: 'Processing your media import'
  }
]

// Import state
const importStatus = ref<'processing' | 'success' | 'error'>('processing')
const importProgress = ref(0)
const importMessage = ref('')
const importError = ref('')

// Provide URL and files to children
provide('urlInput', urlInput)
provide('selectedFiles', selectedFiles)

const isStepComplete = computed(() => {
  if (currentStep.value === 1) {
    return urlInput.value.trim() !== '' || (selectedFiles.value?.length ?? 0) > 0
  }
  if (currentStep.value === 2) {
    return libraryItemForm.name?.trim() ?? '' !== ''
  }
  return false
})

const canProceed = computed(() => isStepComplete.value)

// Only set initial values, don't override if metadata already loaded
watch(
  urlInput,
  (newUrl) => {
    if (newUrl.trim()) {
      // If URL is entered, clear any selected files to maintain mutual exclusivity
      if (selectedFiles.value !== null) {
        selectedFiles.value = null
      }

      libraryItemForm.sourceUri = newUrl.trim()
      // Only set a basic name if none exists yet
      if (!libraryItemForm.name) {
        try {
          const urlObj = new URL(newUrl)
          const pathname = urlObj.pathname
          const fileName = pathname.split('/').pop() || urlObj.hostname
          libraryItemForm.name = fileName.replace(/\.[^/.]+$/, '')
        } catch {
          libraryItemForm.name = newUrl.trim()
        }
      }
    }
  },
  { immediate: true }
)

// Watch for file changes
watch(
  selectedFiles,
  (newFiles) => {
    if (newFiles && newFiles.length > 0 && newFiles[0]) {
      // If file is selected, clear URL input to maintain mutual exclusivity
      if (urlInput.value.trim() !== '') {
        urlInput.value = ''
      }

      // Only set a basic name if none exists yet
      if (!libraryItemForm.name) {
        libraryItemForm.name = newFiles[0].name.replace(/\.[^/.]+$/, '')
      }
      libraryItemForm.sourceUri = `file://${newFiles[0].name}`
    }
  },
  { immediate: true }
)

const nextStep = () => {
  if (currentStep.value < steps.length && canProceed.value) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const handleImport = async () => {
  try {
    // Move to progress step
    currentStep.value = 3
    importStatus.value = 'processing'
    importProgress.value = 0
    importMessage.value = 'Starting import...'
    importError.value = '' // Determine the source
    let source: string | File
    if (selectedFiles.value && selectedFiles.value.length > 0) {
      source = selectedFiles.value[0] // Extract the first file from FileList
      importMessage.value = 'Processing file...'
    } else if (urlInput.value.trim()) {
      source = urlInput.value.trim()
      importMessage.value = 'Processing URL...'
    } else {
      throw new Error('No source selected')
    }

    importProgress.value = 25 // Get the content adapter registry
    const registry = contentRegistry()

    importMessage.value = 'Finding suitable adapter...'
    importProgress.value = 50

    // Process the source
    const result = await registry.processSource(source, {
      originalPath: typeof source === 'string' ? undefined : undefined, // Could add file path logic here
      sourceUrl: typeof source === 'string' ? source : undefined,
      userMetadata: {
        name: libraryItemForm.name,
        type: libraryItemForm.type,
        language: libraryItemForm.language,
        dynamicMetadata: libraryItemForm.dynamicMetadata
        // Don't pass thumbnail here - we'll handle it separately
      }
    })

    if (!result.success) {
      throw new Error(result.error || 'Failed to process source')
    }

    // Now handle thumbnail saving if user selected one
    if (libraryItemForm.thumbnail && result.libraryItemId) {
      try {
        importMessage.value = 'Saving thumbnail...'
        importProgress.value = 85

        console.log('Saving user-selected thumbnail:', {
          libraryItemId: result.libraryItemId,
          thumbnailType: typeof libraryItemForm.thumbnail,
          thumbnailName: libraryItemForm.thumbnail?.name,
          isFile: libraryItemForm.thumbnail instanceof File
        })

        // Ensure we have a valid File object
        if (libraryItemForm.thumbnail instanceof File && libraryItemForm.thumbnail.name) {
          const thumbnailSaved = await storage().saveThumbnail(
            result.libraryItemId,
            libraryItemForm.thumbnail
          )

          if (thumbnailSaved) {
            console.log('Thumbnail saved successfully')
          } else {
            console.warn('Failed to save thumbnail, but continuing with import')
          }
        } else {
          console.warn(
            'Invalid thumbnail object - not a File or missing name:',
            libraryItemForm.thumbnail
          )
        }
      } catch (error) {
        console.error('Error saving thumbnail:', error)
        // Don't fail the entire import for thumbnail issues
      }
    }

    importProgress.value = 100
    importStatus.value = 'success'
    importMessage.value = 'Import completed successfully!' // Emit the successful import
    emit('import', {
      source: typeof source === 'string' ? source : selectedFiles.value!,
      metadata: {
        ...libraryItemForm,
        id: result.libraryItemId
      }
    })

    // Wait a moment to show success, then close
    setTimeout(() => {
      resetForm()
      isOpen.value = false
    }, 2000)
  } catch (error) {
    console.error('Import failed:', error)
    importStatus.value = 'error'
    importError.value = error instanceof Error ? error.message : 'Unknown error occurred'
    importProgress.value = 0
  }
}

const handleDialogClose = () => {
  resetForm()
  isOpen.value = false
}

const resetForm = () => {
  currentStep.value = 1
  urlInput.value = ''
  selectedFiles.value = null

  // Reset import state
  importStatus.value = 'processing'
  importProgress.value = 0
  importMessage.value = ''
  importError.value = ''

  Object.assign(libraryItemForm, {
    name: '',
    type: 'document',
    language: 'en',
    sourceUri: '',
    dynamicMetadata: {
      description: '',
      author: '',
      genre: '',
      tags: []
    },
    thumbnail: undefined
  })
}
</script>

<template>
  <UseImportTemplate>
    <!-- Step Content -->
    <div class="faseeh-import-dialog__content">
      <MediaSelectionStep
        v-if="currentStep === 1"
        v-model:url="urlInput"
        v-model:selected-files="selectedFiles"
      />

      <MediaDetailsStep v-if="currentStep === 2" v-model="libraryItemForm" />

      <ImportProgressStep
        v-if="currentStep === 3"
        :status="importStatus"
        :progress-percentage="importProgress"
        :message="importMessage"
        :error="importError"
      />
    </div>
    <!-- Footer Actions -->
    <div class="faseeh-import-dialog__footer">
      <div class="faseeh-import-dialog__footer-actions">
        <Button v-if="currentStep > 1 && currentStep < 3" variant="outline" @click="prevStep">
          Previous
        </Button>
        <Button v-if="currentStep < 2" :disabled="!canProceed" @click="nextStep"> Next </Button>
        <Button v-if="currentStep === 2" :disabled="!canProceed" @click="handleImport">
          Import
        </Button>
        <Button v-if="currentStep === 3 && importStatus === 'success'" @click="handleDialogClose">
          Done
        </Button>
        <Button
          v-if="currentStep === 3 && importStatus === 'error'"
          variant="outline"
          @click="currentStep = 2"
        >
          Try Again
        </Button>
      </div>
    </div>
  </UseImportTemplate>

  <!-- Desktop Dialog -->
  <Dialog v-if="isDesktop" v-model:open="isOpen">
    <DialogContent class="faseeh-import-dialog">
      <DialogHeader class="faseeh-import-dialog__header">
        <DialogTitle class="faseeh-import-dialog__title">Import Media</DialogTitle>
        <DialogDescription>Import media files or URLs into your library</DialogDescription>
      </DialogHeader>
      <ImportContent />
    </DialogContent>
  </Dialog>

  <!-- Mobile Drawer -->
  <Drawer v-else v-model:open="isOpen">
    <DrawerContent class="faseeh-import-dialog faseeh-import-dialog--mobile">
      <DrawerHeader class="faseeh-import-dialog__mobile-header">
        <DrawerTitle class="faseeh-import-dialog__mobile-title">Import Media</DrawerTitle>
        <DrawerDescription class="faseeh-import-dialog__mobile-description">
          Import media files or URLs into your library
        </DrawerDescription>
      </DrawerHeader>

      <div class="faseeh-import-dialog__mobile-content">
        <ImportContent />
      </div>
    </DrawerContent>
  </Drawer>
</template>
