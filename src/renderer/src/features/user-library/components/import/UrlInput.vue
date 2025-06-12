<script setup lang="ts">
import { Input } from '@renderer/common/components/ui/input'
import { Link } from 'lucide-vue-next'

const url = defineModel<string>('url', { default: '' })
</script>

<template>
  <div class="faseeh-url-input">
    <label class="faseeh-url-input__label">
      <Link class="faseeh-url-input__icon" />
      Paste URL
    </label>
    <Input
      v-model="url"
      placeholder="https://example.com/video.mp4 or paste any media URL"
      class="faseeh-url-input__field"
    />
  </div>
</template>
