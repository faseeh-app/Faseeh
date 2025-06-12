<script setup lang="ts">
import { Button } from '@renderer/common/components/ui/button'
import { Check, FileDown, Pencil } from 'lucide-vue-next'

interface Step {
  step: number
  title: string
  description: string
}

interface Props {
  steps: Step[]
  currentStep: number
}

interface Emits {
  (e: 'step-click', step: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const getStepIcon = (stepNumber: number) => {
  if (stepNumber === 1) return FileDown
  if (stepNumber === 2) return Pencil
  return FileDown
}
</script>

<template>
  <div class="faseeh-step-indicator">
    <div v-for="step in steps" :key="step.step" class="faseeh-step-indicator__step">
      <div
        v-if="step.step !== steps[steps.length - 1].step"
        class="faseeh-step-indicator__connector"
        :class="
          currentStep >= step.step + 1
            ? 'faseeh-step-indicator__connector--active'
            : 'faseeh-step-indicator__connector--inactive'
        "
      />
      <Button
        :variant="currentStep >= step.step ? 'default' : 'outline'"
        size="icon"
        class="faseeh-step-indicator__button"
        :class="[currentStep === step.step && 'faseeh-step-indicator__button--current']"
        @click="emit('step-click', step.step)"
      >
        <Check v-if="currentStep > step.step" class="faseeh-step-indicator__icon--check" />
        <component :is="getStepIcon(step.step)" v-else class="faseeh-step-indicator__icon" />
      </Button>
      <div class="faseeh-step-indicator__label">
        <div class="faseeh-step-indicator__title">{{ step.title }}</div>
        <div class="faseeh-step-indicator__description">{{ step.description }}</div>
      </div>
    </div>
  </div>
</template>
