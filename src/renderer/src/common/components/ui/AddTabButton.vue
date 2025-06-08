<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
  Tooltip
} from '@renderer/common/components/ui/tooltip'
import { useTabStore } from '@renderer/common/stores/useTabStore'

const tabStore = useTabStore()
const router = useRouter()

// Add tab functionality
const handleAddTab = () => {
  // Always create a fresh Library tab without duplicating state
  tabStore.openLibraryTab()
  // Navigate to the library route
  router.push({ name: 'library' })
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
