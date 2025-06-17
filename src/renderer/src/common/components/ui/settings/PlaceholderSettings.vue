<script setup lang="ts">
interface Props {
  sectionName: string
}

defineProps<Props>()
</script>

<template>
  <div class="space-y-8">
    <div class="space-y-8">
      <div>
        <h3 class="text-xl font-semibold mb-6">{{ sectionName }}</h3>
        <p class="text-sm text-muted-foreground mb-8">
          Settings for {{ sectionName.toLowerCase() }} will be available here.
        </p>
        <div class="grid gap-6">
          <div v-for="i in 3" :key="i" class="h-20 rounded-lg bg-muted/50 animate-pulse" />
        </div>
      </div>
    </div>
  </div>
</template>
