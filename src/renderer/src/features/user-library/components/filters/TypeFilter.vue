<script setup lang="ts">
import FilterMenu from '@/common/components/ui/FilterMenu.vue'
import { ref } from 'vue'

const options = ref([
  { value: 'collection', label: 'Collection', disabled: false },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
  { value: 'document', label: 'Document' },
  { value: 'article', label: 'Article' }
])

const selected = ref()
</script>
<template>
  <FilterMenu
    v-model:selected-value="selected"
    class="w-30"
    :options="options"
    label="Select Type"
    placeholder="All Media"
  />
</template>
