<script setup lang="ts">
import FilterMenu from '@/common/components/ui/FilterMenu.vue'
import { ref } from 'vue'

const languageOptions = ref([
  { value: 'en-us', label: 'English', disabled: false },
  { value: 'ar', label: 'Arabic' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' }
])

const selectedLanguage = ref()
</script>
<template>
  <FilterMenu
    v-model:selected-value="selectedLanguage"
    class="w-28"
    :options="languageOptions"
    label="Select Language"
    placeholder="All Languages"
  />
</template>
