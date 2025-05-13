<script setup lang="ts">
import FilterMenu from '@/common/components/ui/FilterMenu.vue'
import { LibraryFilterStore } from '@/features/user-library/stores/filterStore'
import { computed, ref } from 'vue'

const filterStore = LibraryFilterStore()
const languageOptions = ref([
  {
    value: 'en-us',
    label: 'English',
    isActive: computed(() => filterStore.isLanguageSelected('English')).value,
    disabled: false,
    onClick: () => filterStore.setLanguage('English')
  },
  {
    value: 'ar',
    label: 'Arabic',
    isActive: computed(() => filterStore.isLanguageSelected('Arabic')).value,
    disabled: false,
    onClick: () => filterStore.setLanguage('Arabic')
  },
  {
    value: 'fr',
    label: 'French',
    isActive: computed(() => filterStore.isLanguageSelected('French')).value,
    disabled: false,
    onClick: () => filterStore.setLanguage('French')
  },
  {
    value: 'es',
    label: 'Spanish',
    isActive: computed(() => filterStore.isLanguageSelected('Spanish')).value,
    disabled: false,
    onClick: () => filterStore.setLanguage('Spanish')
  }
])
</script>
<template>
  <FilterMenu
    class="w-24"
    :options="languageOptions"
    :value="filterStore.LanguageLabel"
    :reset-action="() => filterStore.setLanguage(undefined)"
    :disabled="false"
    label="Select Language"
    :is-active="filterStore.isLangugaeFiltered"
  />
</template>
