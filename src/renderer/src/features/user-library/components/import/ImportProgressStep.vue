<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-vue-next'

interface Props {
  status: 'processing' | 'success' | 'error'
  progress?: number
  message?: string
  error?: string
}

const props = defineProps<Props>()

const statusIcon = computed(() => {
  switch (props.status) {
    case 'processing':
      return Loader2
    case 'success':
      return CheckCircle
    case 'error':
      return AlertCircle
    default:
      return Loader2
  }
})

const statusColor = computed(() => {
  switch (props.status) {
    case 'processing':
      return 'text-blue-500'
    case 'success':
      return 'text-green-500'
    case 'error':
      return 'text-red-500'
    default:
      return 'text-blue-500'
  }
})

const progressPercentage = computed(() => {
  return Math.min(Math.max(props.progress || 0, 0), 100)
})
</script>

<template>
  <div class="faseeh-import-progress">
    <div class="faseeh-import-progress__container">
      <!-- Status Icon -->
      <div class="faseeh-import-progress__icon-container">
        <component
          :is="statusIcon"
          :class="[
            'faseeh-import-progress__icon',
            statusColor,
            { 'faseeh-import-progress__icon--spinning': status === 'processing' }
          ]"
        />
      </div>

      <!-- Progress Content -->
      <div class="faseeh-import-progress__content">
        <!-- Progress Bar (when processing) -->
        <div v-if="status === 'processing'" class="faseeh-import-progress__progress-container">
          <div class="faseeh-import-progress__progress-bar">
            <div
              class="faseeh-import-progress__progress-fill"
              :style="{ width: `${progressPercentage}%` }"
            ></div>
          </div>
          <div class="faseeh-import-progress__percentage">{{ progressPercentage }}%</div>
        </div>

        <!-- Status Message -->
        <div class="faseeh-import-progress__message">
          <h3 class="faseeh-import-progress__title">
            <span v-if="status === 'processing'">Processing Media</span>
            <span v-else-if="status === 'success'">Import Successful</span>
            <span v-else-if="status === 'error'">Import Failed</span>
          </h3>
          <p v-if="message" class="faseeh-import-progress__description">
            {{ message }}
          </p>
          <p v-if="error" class="faseeh-import-progress__error">
            {{ error }}
          </p>
        </div>

        <!-- Success Details -->
        <div v-if="status === 'success'" class="faseeh-import-progress__success-details">
          <p class="faseeh-import-progress__success-text">
            Your media has been successfully imported and processed. You can now find it in your
            library.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
