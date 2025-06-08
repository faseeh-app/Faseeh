<script setup lang="ts">
import { computed } from 'vue'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from '@renderer/common/components/ui/tooltip'
import { useTabStore } from '@renderer/common/stores/useTabStore'
import { useRouter } from 'vue-router'
import { RouteNames } from '@renderer/common/router/routes'

const tabStore = useTabStore()
const router = useRouter()

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
      tabStore.openLibraryTab(forceNew)
      router.push({ name: RouteNames.LIBRARY })
    }
  },
  {
    id: 'discover',
    icon: 'icon-[fa-regular--compass]',
    activeIcon: 'icon-[fa-solid--compass]',
    label: 'Discover',
    action: (forceNew: boolean = false) => {
      tabStore.openCommunityTab(forceNew)
      router.push({ name: RouteNames.COMMUNITY })
    }
  },
  {
    id: 'search',
    icon: 'icon-[iconamoon--search-bold]',
    activeIcon: 'icon-[iconamoon--search-duotone]',
    label: 'Search',
    action: (_forceNew: boolean = false) => {
      // For now, just a placeholder
      console.log('Search functionality coming soon!')
    }
  },
  {
    id: 'settings',
    icon: 'icon-[solar--settings-linear]',
    activeIcon: 'icon-[solar--settings-bold]',
    label: 'Settings',
    action: (forceNew: boolean = false) => {
      tabStore.openSettingsTab(forceNew)
      router.push({ name: RouteNames.SETTINGS })
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
  </TooltipProvider>
</template>
