<script setup lang="ts">
import type { DialogRootEmits, DialogRootProps } from 'reka-ui'
import { useForwardPropsEmits } from 'reka-ui'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@renderer/common/components/ui/dialog'
import Command from './Command.vue'

const props = withDefaults(
  defineProps<
    DialogRootProps & {
      title?: string
      description?: string
    }
  >(),
  {
    title: 'Command Palette',
    description: 'Search for a command to run...'
  }
)
const emits = defineEmits<DialogRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <Dialog v-bind="forwarded">
    <DialogContent
      class="overflow-hidden p-0 shadow-2xl border-border/50 max-w-[800px] w-[95vw] sm:max-w-[800px] max-h-[600px]"
    >
      <DialogHeader class="sr-only">
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>{{ description }}</DialogDescription>
      </DialogHeader>
      <Command
        class="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
      >
        <slot />
      </Command>
    </DialogContent>
  </Dialog>
</template>
