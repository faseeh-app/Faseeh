<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

interface Props {
  fallback?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  fallback: true
})

const emit = defineEmits<{
  error: [error: Error]
}>()

const hasError = ref(false)
const error = ref<Error | null>(null)

onErrorCaptured((err: Error) => {
  hasError.value = true
  error.value = err
  emit('error', err)
  console.error('Plugin UI Error:', err)
  return false // Prevent the error from propagating further
})

const retry = () => {
  hasError.value = false
  error.value = null
}
</script>

<template>
  <div v-if="hasError && fallback" class="flex items-center justify-center h-full p-4">
    <div class="text-center space-y-3 max-w-sm">
      <div
        class="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto"
      >
        <span class="icon-[lucide--alert-triangle] w-6 h-6 text-destructive" />
      </div>
      <div>
        <h4 class="text-sm font-medium text-foreground mb-1">Something went wrong</h4>
        <p class="text-xs text-muted-foreground">
          {{ error?.message || 'An unexpected error occurred' }}
        </p>
      </div>
      <button
        class="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
        @click="retry"
      >
        Try Again
      </button>
    </div>
  </div>
  <slot v-else />
</template>
