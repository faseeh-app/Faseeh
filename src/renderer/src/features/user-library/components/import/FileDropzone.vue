<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@renderer/common/components/ui/button'
import { Upload, FolderOpen, FileDown } from 'lucide-vue-next'

const selectedFiles = defineModel<FileList | null>('selectedFiles', { default: null })

const dragActive = ref(false)
const fileInputRef = ref<HTMLInputElement>()

// Handle drag and drop
const handleDragEnter = (e: DragEvent) => {
  e.preventDefault()
  dragActive.value = true
}

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault()
  if (!e.relatedTarget || !(e.target as Element).contains(e.relatedTarget as Node)) {
    dragActive.value = false
  }
}

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  dragActive.value = false

  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    selectedFiles.value = files
  }
}

// Handle file selection
const handleFileSelect = () => {
  fileInputRef.value?.click()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    selectedFiles.value = target.files
  }
}
</script>

<template>
  <div class="faseeh-file-dropzone">
    <label class="faseeh-file-dropzone__label">
      <FolderOpen class="faseeh-file-dropzone__label-icon" />
      Select Files
    </label>

    <!-- Drag and Drop Area -->
    <div
      class="faseeh-file-dropzone__area"
      :class="
        dragActive ? 'faseeh-file-dropzone__area--active' : 'faseeh-file-dropzone__area--inactive'
      "
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      @dragover="handleDragOver"
      @drop="handleDrop"
    >
      <Upload class="faseeh-file-dropzone__upload-icon" />
      <div class="faseeh-file-dropzone__content">
        <p class="faseeh-file-dropzone__text">
          Drop files here or
          <Button
            variant="link"
            class="faseeh-file-dropzone__browse-button"
            @click="handleFileSelect"
          >
            browse files
          </Button>
        </p>
        <p class="faseeh-file-dropzone__help-text">Supports video, audio, documents, and more</p>
      </div>

      <!-- Selected Files Display -->
      <div
        v-if="selectedFiles && selectedFiles.length > 0"
        class="faseeh-file-dropzone__selected-files"
      >
        <div class="faseeh-file-dropzone__selected-title">Selected Files:</div>
        <div class="faseeh-file-dropzone__file-list">
          <div
            v-for="(file, index) in Array.from(selectedFiles)"
            :key="index"
            class="faseeh-file-dropzone__file-item"
          >
            <FileDown class="faseeh-file-dropzone__file-icon" />
            <span>{{ file.name }}</span>
            <span class="faseeh-file-dropzone__file-size">
              ({{ (file.size / 1024 / 1024).toFixed(2) }} MB)
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden File Input -->
    <input
      ref="fileInputRef"
      type="file"
      multiple
      class="faseeh-file-dropzone__hidden-input"
      accept="*/*"
      @change="handleFileChange"
    />
  </div>
</template>
