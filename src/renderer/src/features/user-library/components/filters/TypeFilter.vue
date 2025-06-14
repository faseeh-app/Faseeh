<script setup lang="ts">
import FilterMenu from '@renderer/common/components/FilterMenu.vue'
import { ref, computed } from 'vue'

const options = ref([
  { value: 'collection', label: 'Collection', disabled: false },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
  { value: 'document', label: 'Document' },
  { value: 'article', label: 'Article' }
])

const selectedValue = ref<string | undefined>(undefined)

const selected = computed({
  get: () =>
    selectedValue.value
      ? options.value.find((opt) => opt.value === selectedValue.value)
      : undefined,
  set: (newSelected) => {
    selectedValue.value = newSelected?.value
  }
})
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
