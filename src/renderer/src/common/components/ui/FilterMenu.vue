<script lang="ts" setup>
import { Button } from '@/common/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/common/components/ui/dropdown-menu'
import { computed, type PropType, ref } from 'vue'
import { LibraryFilterStore } from '@/features/user-library/stores/filterStore'

const store = LibraryFilterStore()
const props = defineProps({
  class: { type: String, default: '' },
  value: { type: String },
  label: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false },
  resetAction: { type: Function as PropType<() => void> },
  options: {
    type: Array as PropType<
      Array<{
        value: string
        label: string
        isActive: boolean
        disabled: boolean
        onClick: () => void
      }>
    >,
    required: true
  }
})

const slectedValue = ref(props.value)

const leftPadding = computed(() => (props.isActive ? 'pr-0' : ''))
const variant = computed(() => (props.isActive ? 'default' : 'outline'))
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button :class="props.class + ' ' + leftPadding" :variant="variant">
        {{ value }}
        <Button
          v-if="isActive"
          size="icon"
          variant="ghost"
          class="hover:bg-transparent"
          @click.stop="resetAction"
        >
          <span class="icon-[fluent-emoji-high-contrast--multiply]"> </span>
        </Button>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent class="faseeh-filter-menu__content">
      <DropdownMenuLabel v-if="props.label">{{ props.label }}</DropdownMenuLabel>
      <DropdownMenuSeparator v-if="props.label" />
      <DropdownMenuRadioGroup v-model="slectedValue" :disabled="props.disabled">
        <DropdownMenuRadioItem
          v-for="option in options"
          :value="option.value"
          :disabled="option.disabled"
          @click="option.onClick"
        >
          <slot name="radio-item" :value="option.value">
            {{ option.label }}
          </slot>
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
