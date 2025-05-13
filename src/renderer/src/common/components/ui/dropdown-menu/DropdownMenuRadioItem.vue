<script setup lang="ts">
import { cn } from '@/common/lib/utils'
import { Circle } from 'lucide-vue-next'
import {
  DropdownMenuItemIndicator,
  DropdownMenuRadioItem,
  type DropdownMenuRadioItemEmits,
  type DropdownMenuRadioItemProps,
  useForwardPropsEmits,
} from 'reka-ui'
import { computed, type HTMLAttributes } from 'vue'

const props = defineProps<DropdownMenuRadioItemProps & { class?: HTMLAttributes['class'] }>()

const emits = defineEmits<DropdownMenuRadioItemEmits>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <DropdownMenuRadioItem data-slot="dropdown-menu-radio-item" v-bind="forwarded" :class="cn(
    `focus:bg-accent focus:text-accent-foreground relative flex justify-between cursor-default items-center gap-2 rounded-sm py-1.5 px-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4`,
    props.class,
  )">
    <slot />
    <span class="pointer-events-none h-full flex items-center justify-center">
      <DropdownMenuItemIndicator class="">
        <Circle class="size-2 fill-current" />
      </DropdownMenuItemIndicator>
    </span>
  </DropdownMenuRadioItem>
</template>
