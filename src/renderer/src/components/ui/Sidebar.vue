<script setup lang="ts">
import { ref } from 'vue'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'

// Track active view
const activeView = ref('dashboard')

// Define view navigation buttons
const navButtons = [
  { id: 'dashboard', icon: 'solar--library-bold-duotone', label: 'Dashboard' },
  { id: 'documents', icon: 'solar--document-bold', label: 'Documents' },
  { id: 'dictionary', icon: 'solar--book-bold', label: 'Dictionary' },
  { id: 'settings', icon: 'solar--settings-bold', label: 'Settings' }
]

// Define command buttons
const commandButtons = [
  {
    id: 'create-new',
    icon: 'solar--add-square-bold',
    label: 'Create New',
    action: openCreateModal
  },
  { id: 'search', icon: 'solar--magnifer-bold', label: 'Search', action: openSearchModal }
]

// Change the active view
function setActiveView(viewId: string): void {
  activeView.value = viewId
  // Here you would typically use router.push() to navigate
}

// Command button actions
function openCreateModal(): void {
  // Implementation for opening create modal
  console.log('Opening create modal')
}

function openSearchModal(): void {
  // Implementation for opening search modal
  console.log('Opening search modal')
}
</script>

<template>
  <TooltipProvider>
    <div class="faseeh-sidebar">
      <!-- Navigation Buttons -->
      <div class="pt-2">
        <Tooltip v-for="button in navButtons" :key="button.id">
          <TooltipTrigger as-child>
            <button class="faseeh-sidebar__button" :class="{ active: activeView === button.id }"
              @click="setActiveView(button.id)">
              <span :class="`icon-[${button.icon}]`" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {{ button.label }}
          </TooltipContent>
        </Tooltip>
      </div>

      <!-- Divider between navigation and command buttons -->
      <div class="faseeh-sidebar__divider" />

      <!-- Command Buttons -->
      <div>
        <Tooltip v-for="button in commandButtons" :key="button.id">
          <TooltipTrigger as-child>
            <button class="faseeh-sidebar__button" @click="button.action">
              <span :class="`icon-[${button.icon}]`" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {{ button.label }}
          </TooltipContent>
        </Tooltip>
      </div>

      <!-- Spacer to push profile to bottom -->
      <div class="flex-grow"></div>

      <!-- Profile button at bottom -->
      <Tooltip>
        <TooltipTrigger as-child>
          <button class="faseeh-sidebar__button mb-2">
            <span class="icon-[solar--user-circle-bold]" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right"> Profile </TooltipContent>
      </Tooltip>
    </div>
  </TooltipProvider>
</template>
