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
  }
]

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

const handleImport = () => {
  // TODO: Implement import logic
  resetForm()
  isOpen.value = false
}

const handleDialogClose = () => {
  resetForm()
  isOpen.value = false
}

const resetForm = () => {
  currentStep.value = 1
  urlInput.value = ''
  selectedFiles.value = null
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
    </div>
    <!-- Footer Actions -->
    <div class="faseeh-import-dialog__footer">
      <div class="faseeh-import-dialog__footer-actions">
        <Button v-if="currentStep > 1" variant="outline" @click="prevStep"> Previous </Button>
        <Button v-if="currentStep < steps.length" :disabled="!canProceed" @click="nextStep">
          Next
        </Button>
        <Button v-if="currentStep === steps.length" :disabled="!canProceed" @click="handleImport">
          Import
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
