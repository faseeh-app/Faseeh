<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@renderer/common/components/ui/button'
import { type Tab } from '@renderer/common/stores/useTabStore'
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@renderer/common/components/ui/tooltip'

interface Props {
  tab: Tab
  isActive: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: [tabId: string]
  activate: [tabId: string]
  'context-menu': [tabId: string, event: MouseEvent]
}>()

const tabClasses = computed(() => [
  'faseeh-titlebar__tabs__item',
  'group',
  {
    active: props.isActive,
    dirty: props.tab.isDirty
  }
])

const handleTabClick = () => {
  emit('activate', props.tab.id)
}

const handleCloseClick = (event: MouseEvent) => {
  event.stopPropagation()
  if (props.tab.closable) {
    emit('close', props.tab.id)
  }
}

const handleContextMenu = (event: MouseEvent) => {
  event.preventDefault()
  emit('context-menu', props.tab.id, event)
}

const handleMiddleClick = (event: MouseEvent) => {
  // Close tab on middle mouse button click
  if (event.button === 1 && props.tab.closable) {
    event.preventDefault()
    emit('close', props.tab.id)
  }
}
</script>

<template>
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger as-child>
        <div
          :class="tabClasses"
          @click="handleTabClick"
          @contextmenu="handleContextMenu"
          @mousedown="handleMiddleClick"
        >
          <div class="faseeh-titlebar__tabs__item__content">
            <span class="faseeh-titlebar__tabs__item__title">
              {{ tab.title }}
            </span>
          </div>

          <Button
            v-if="tab.closable"
            variant="ghost"
            size="icon"
            class="faseeh-titlebar__tabs__item__button size-6"
            @click="handleCloseClick"
          >
            <span class="icon-[fluent-emoji-high-contrast--multiply] size-2.5" />
          </Button>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {{ tab.title }}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>
