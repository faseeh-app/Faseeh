<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { Search } from 'lucide-vue-next'
import { ListboxFilter, type ListboxFilterProps, useForwardProps } from 'reka-ui'
import { cn } from '@renderer/common/lib/utils'
import { useCommand } from '.'

defineOptions({
  inheritAttrs: false
})

const props = defineProps<
  ListboxFilterProps & {
    class?: HTMLAttributes['class']
  }
>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)

const { filterState } = useCommand()
</script>

<template>
  <div
    data-slot="command-input-wrapper"
    class="flex h-16 items-center gap-3 border-b border-border/50 px-4"
  >
    <Search class="size-5 shrink-0 opacity-50" />
    <ListboxFilter
      v-bind="{ ...forwardedProps, ...$attrs }"
      v-model="filterState.search"
      data-slot="command-input"
      auto-focus
      :class="
        cn(
          'placeholder:text-muted-foreground flex h-16 w-full rounded-md bg-transparent py-4 text-base outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
          props.class
        )
      "
    />
  </div>
</template>
