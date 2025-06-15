<script setup lang="ts">
import {
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
  Tooltip
} from '@renderer/common/components/ui/tooltip'
import { useTabRouter } from '@renderer/core/services/tabRouter'

const tabRouter = useTabRouter()

// Add tab functionality
const handleAddTab = () => {
  tabRouter.push({ name: 'library' }, { title: 'Library', newTab: true })
}
</script>

<template>
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger as-child>
        <button class="faseeh-titlebar__tabs__add-button" @click="handleAddTab">
          <span class="icon-[fluent--add-12-regular] size-3" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">Add Tab</TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>
