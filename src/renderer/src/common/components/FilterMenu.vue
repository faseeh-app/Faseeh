<script lang="ts" setup>
import { Button } from '@renderer/common/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@renderer/common/components/ui/dropdown-menu'
import { computed, ref, watch, type PropType } from 'vue'

const props = defineProps({
  class: { type: String, default: '' },
  placeholder: { type: String, default: 'All' },
  label: { type: String, default: '' },
  options: {
    type: Array as PropType<Array<{ value: string; label: string; disabled?: boolean }>>,
    required: true
  }
})

let selectedItem = defineModel('selectedValue', {
  type: Object as PropType<{
    value: string
    label: string
    disabled?: boolean
  }>
})

const selectedValue = ref(selectedItem.value?.value)
watch(selectedValue, (newVal) => {
  const selectedOption = props.options.find((option) => option.value === newVal)
  selectedItem.value = selectedOption
})

const leftPadding = computed(() => (selectedItem.value ? 'pr-0' : ''))
const variant = computed(() => (selectedItem.value ? 'default' : 'outline'))
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button :class="props.class + ' ' + leftPadding" :variant="variant">
        {{ selectedItem?.label || props.placeholder }}
        <Button
          v-if="selectedItem"
          size="icon"
          variant="ghost"
          class="hover:bg-transparent size-10"
          @click.stop="() => (selectedValue = undefined)"
        >
          <span class="icon-[fluent-emoji-high-contrast--multiply]"> </span>
        </Button>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent class="faseeh-filter-menu__content">
      <DropdownMenuLabel v-if="props.label">{{ props.label }}</DropdownMenuLabel>
      <DropdownMenuSeparator v-if="props.label" />
      <DropdownMenuRadioGroup v-model="selectedValue">
        <DropdownMenuRadioItem
          v-for="option in options"
          :value="option.value"
          :disabled="option.disabled"
        >
          <slot name="radio-item" :value="option.value">
            {{ option.label }}
          </slot>
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
