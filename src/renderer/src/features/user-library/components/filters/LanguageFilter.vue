<script setup lang="ts">
import FilterMenu from '@renderer/common/components/ui/FilterMenu.vue'
import { ref } from 'vue'
import { useTabState } from '@renderer/common/composables/useTabState'

const options = ref([
  { value: 'en-us', label: 'English', disabled: false },
  { value: 'ar', label: 'Arabic' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' }
])

const { state: selected } = useTabState('languageFilter', undefined)
</script>
<template>
  <FilterMenu
    v-model:selected-value="selected"
    class="w-28"
    :options="options"
    label="Select Language"
    placeholder="All Languages"
  />
</template>
