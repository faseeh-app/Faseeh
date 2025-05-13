<script setup lang="ts">
import FilterMenu from '@/common/components/ui/FilterMenu.vue'
import { LibraryFilterStore } from '@/features/user-library/stores/filterStore'
import { computed, ref } from 'vue'

const filterStore = LibraryFilterStore()
const typeOptions = ref([])
</script>
<template>
  <FilterMenu
    class="w-24"
    :options="typeOptions"
    :value="filterStore.LanguageLabel"
    :reset-action="() => filterStore.setLanguage(undefined)"
    :disabled="false"
    label="Select Language"
    :is-active="filterStore.isLangugaeFiltered"
  />
</template>
