<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from '@renderer/common/components/ui/tooltip'
import CommandPalette from '@renderer/common/components/CommandPalette.vue'
import SettingsDialog from '@renderer/common/components/ui/SettingsDialog.vue'
import { useTabStore } from '@renderer/core/stores/useTabStore'
import { useTabRouter } from '@renderer/core/services/tabRouter'

const tabStore = useTabStore()
const tabRouter = useTabRouter()

// Command palette state
const isCommandPaletteOpen = ref(false)
const isSettingsDialogOpen = ref(false)

const openCommandPalette = () => {
  isCommandPaletteOpen.value = true
}

const closeCommandPalette = () => {
  isCommandPaletteOpen.value = false
}

const openSettingsDialog = () => {
  isSettingsDialogOpen.value = true
}

const closeSettingsDialog = () => {
  isSettingsDialogOpen.value = false
}

// Event listeners for keyboard shortcuts
const handleOpenCommandPalette = () => {
  openCommandPalette()
}

const handleOpenSettings = () => {
  openSettingsDialog()
}

onMounted(() => {
  document.addEventListener('open-command-palette', handleOpenCommandPalette)
  document.addEventListener('open-settings', handleOpenSettings)
})

onUnmounted(() => {
  document.removeEventListener('open-command-palette', handleOpenCommandPalette)
  document.removeEventListener('open-settings', handleOpenSettings)
})

const activeView = computed(() => {
  const activeTab = tabStore.activeTab
  if (!activeTab) return 'library'

  switch (activeTab.route.name) {
    case 'library':
      return 'library'
    case 'community':
      return 'discover'
    case 'settings':
      return 'settings'
    default:
      return 'library'
  }
})

const navButtons = [
  {
    id: 'library',
    icon: 'icon-[solar--library-linear]',
    activeIcon: 'icon-[solar--library-bold]',
    label: 'Library',
    action: (forceNew: boolean = false) => {
      tabRouter.push({ name: 'library' }, { title: 'Library', newTab: forceNew })
    }
  },
  {
    id: 'discover',
    icon: 'icon-[fa-regular--compass]',
    activeIcon: 'icon-[fa-solid--compass]',
    label: 'Discover',
    action: (forceNew: boolean = false) => {
      tabRouter.push({ name: 'community' }, { title: 'Community', newTab: forceNew })
    }
  },
  {
    id: 'search',
    icon: 'icon-[iconamoon--search-bold]',
    activeIcon: 'icon-[iconamoon--search-duotone]',
    label: 'Search',
    action: (_forceNew: boolean = false) => {
      openCommandPalette()
    }
  },
  {
    id: 'settings',
    icon: 'icon-[solar--settings-linear]',
    activeIcon: 'icon-[solar--settings-bold]',
    label: 'Settings',
    action: (_forceNew: boolean = false) => {
      openSettingsDialog()
    }
  }
]

// Handle navbar button click with Ctrl key detection
const handleNavButtonClick = (button: (typeof navButtons)[0], event: MouseEvent) => {
  const forceNew = event.ctrlKey || event.metaKey // Support both Ctrl (Windows/Linux) and Cmd (Mac)
  button.action(forceNew)
}
</script>

<template>
  <TooltipProvider>
    <div class="faseeh-sidebar">
      <img src="@renderer/common/assets/svg/Fasseh_Logo_Dark.svg" class="faseeh-sidebar__logo" />
      <Tooltip v-for="button in navButtons" :key="button.id">
        <TooltipTrigger as-child>
          <button
            class="faseeh-sidebar__button"
            :class="{ active: activeView === button.id }"
            @click="(event) => handleNavButtonClick(button, event)"
          >
            <span
              :class="`faseeh-icon ${activeView === button.id ? button.activeIcon : button.icon}`"
            />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          {{ button.label }}
          <div class="text-xs text-muted-foreground mt-1">Hold Ctrl to open in new tab</div>
        </TooltipContent>
      </Tooltip>
    </div>
    <!-- Command Palette -->
    <CommandPalette
      :is-open="isCommandPaletteOpen"
      :open-settings="openSettingsDialog"
      @close="closeCommandPalette"
    />

    <!-- Settings Dialog -->
    <SettingsDialog :is-open="isSettingsDialogOpen" @close="closeSettingsDialog" />
  </TooltipProvider>
</template>
