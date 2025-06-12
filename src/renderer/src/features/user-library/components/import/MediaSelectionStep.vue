<script setup lang="ts">
import UrlInput from './UrlInput.vue'
import FileDropzone from './FileDropzone.vue'
const urlInput = defineModel<string>('url', { default: '' })
const selectedFiles = defineModel<FileList | null>('selectedFiles', { default: null })
</script>

<template>
  <div class="faseeh-media-selection">
    <UrlInput v-model:url="urlInput" />

    <div class="faseeh-media-selection__divider">
      <div class="faseeh-media-selection__divider-line"></div>
      <span class="faseeh-media-selection__divider-text">OR</span>
      <div class="faseeh-media-selection__divider-line"></div>
    </div>

    <FileDropzone v-model:selected-files="selectedFiles" />
  </div>
</template>
