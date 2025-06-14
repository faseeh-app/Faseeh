<script setup lang="ts">
import FilterMenu from '@renderer/common/components/FilterMenu.vue'
import { ref, computed } from 'vue'

const options = ref([
  { value: 'en-us', label: 'English', disabled: false },
  { value: 'ar', label: 'Arabic' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' }
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
    class="w-28"
    :options="options"
    label="Select Language"
    placeholder="All Languages"
  />
</template>
