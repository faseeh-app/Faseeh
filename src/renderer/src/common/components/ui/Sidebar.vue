<script setup lang="ts">
import { ref } from 'vue'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from '@renderer/common/components/ui/tooltip'
import { RouteNames } from '@renderer/common/router/routes'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()

// Track active view
const activeView = ref('library')

const navButtons = [
  {
    id: 'library',
    icon: 'icon-[solar--library-linear]',
    activeIcon: 'icon-[solar--library-bold]',
    label: 'Library',
    action: () => {
      router.replace({ name: RouteNames.LIBRARY })
    }
  },
  {
    id: 'discover',
    icon: 'icon-[fa-regular--compass]',
    activeIcon: 'icon-[fa-solid--compass]',
    label: 'Discover',
    action: () => {
      router.replace({ name: RouteNames.COMMUNITY })
    }
  },
  {
    id: 'search',
    icon: 'icon-[iconamoon--search-bold]',
    activeIcon: 'icon-[iconamoon--search-duotone]',
    label: 'Search',
    action: () => {}
  },
  {
    id: 'settings',
    icon: 'icon-[solar--settings-linear]',
    activeIcon: 'icon-[solar--settings-bold]',
    label: 'Settings',
    action: () => {}
  }
]
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
            @click="
              () => {
                activeView = button.id
                button.action()
              }
            "
          >
            <span
              :class="`faseeh-icon ${activeView === button.id ? button.activeIcon : button.icon}`"
            />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          {{ button.label }}
        </TooltipContent>
      </Tooltip>
    </div>
  </TooltipProvider>
</template>
