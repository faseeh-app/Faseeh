<script setup lang="ts">
import { Input } from '@renderer/common/components/ui/input'
import { ref } from 'vue'

const searchQuery = ref('')
</script>

<template>
  <div class="relative w-full items-center">
    <Input id="search" type="text" placeholder="Search..." class="pl-10" v-model="searchQuery" />
    <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
      <span class="size-5 bg-accent-foreground icon-[iconamoon--search-bold]" />
    </span>
  </div>
</template>
