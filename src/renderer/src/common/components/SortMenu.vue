<script lang="ts" setup>
import { Button } from '@renderer/common/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@renderer/common/components/ui/dropdown-menu'
import { ref } from 'vue'

const sortOption = ref('recently-added')

const sortOptions = [
  {
    value: 'alphabetical',
    label: 'A-Z',
    icon: 'icon-[iconamoon--sort-asc-bold]'
  },
  {
    value: 'reverse-alphabetical',
    label: 'Z-A',
    icon: 'icon-[iconamoon--sort-desc-bold]'
  },
  {
    value: 'recently-added',
    label: 'Recently Added',
    icon: 'icon-[iconamoon--clock-bold]'
  },
  {
    value: 'recently-modified',
    label: 'Recently Modified',
    icon: 'icon-[iconamoon--clock-bold]'
  }
]
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="outline" size="icon">
        <span class="size-5 icon-[solar--sort-from-bottom-to-top-bold]" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent class="">
      <DropdownMenuRadioGroup v-model="sortOption">
        <DropdownMenuRadioItem
          v-for="option in sortOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
