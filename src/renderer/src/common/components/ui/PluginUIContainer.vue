<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { cn } from '@renderer/common/lib/utils'
import { usePanelState } from '@renderer/common/composables/usePanelState'
import { Button } from '@renderer/common/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@renderer/common/components/ui/dropdown-menu'
import { ScrollArea } from '@renderer/common/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@renderer/common/components/ui/tooltip'
import ErrorBoundary from '@renderer/common/components/ui/ErrorBoundary.vue'

interface Props {
  class?: string
}

const props = defineProps<Props>()

const {
  isShowingPluginContent,
  activePluginView,
  panelTitle,
  canClosePanel,
  closePluginView,
  getAvailablePluginViews,
  openPluginView
} = usePanelState()

const errorMessage = ref<string | null>(null)
const isLoading = ref(false)
const pluginContainer = ref<HTMLDivElement | null>(null)

// Track mounted views to handle cleanup
const mountedViews = new Map<string, () => Promise<void> | void>()

// Get available plugin views for the dropdown
const availableViews = computed(() => getAvailablePluginViews())

// Group views by plugin
const viewsByPlugin = computed(() => {
  const groups = new Map<string, typeof availableViews.value>()

  availableViews.value.forEach((view) => {
    if (!groups.has(view.pluginId)) {
      groups.set(view.pluginId, [])
    }
    groups.get(view.pluginId)!.push(view)
  })

  return groups
})

// Handle view switching
const handleViewChange = (pluginId: string, viewId: string) => {
  isLoading.value = true
  errorMessage.value = null

  try {
    openPluginView(pluginId, viewId)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to load plugin view'
  } finally {
    isLoading.value = false
  }
}

// Handle closing plugin view
const handleCloseView = () => {
  if (canClosePanel.value) {
    closePluginView()
  }
}

// Error handling for plugin components
const handlePluginError = (error: Error) => {
  console.error('Plugin UI error:', error)
  errorMessage.value = `Plugin error: ${error.message}`
}

// Mount a plugin view
const mountPluginView = async (view: any) => {
  if (!pluginContainer.value || !view.onMount) {
    return
  }

  const viewKey = `${view.pluginId}:${view.id}`

  try {
    // Clear the container
    pluginContainer.value.innerHTML = ''

    // Call the plugin's onMount callback with the container element
    await view.onMount(pluginContainer.value)

    // Store cleanup function if onUnmount is provided
    if (view.onUnmount) {
      mountedViews.set(viewKey, view.onUnmount)
    }
  } catch (error) {
    console.error(`[PluginUIContainer] Error mounting view ${viewKey}:`, error)
    handlePluginError(error instanceof Error ? error : new Error('Failed to mount plugin view'))
  }
}

// Unmount current plugin view
const unmountCurrentView = async () => {
  if (!activePluginView.value) return

  const viewKey = `${activePluginView.value.pluginId}:${activePluginView.value.id}`
  const unmountCallback = mountedViews.get(viewKey)

  if (unmountCallback) {
    try {
      await unmountCallback()
    } catch (error) {
      console.error(`[PluginUIContainer] Error unmounting view ${viewKey}:`, error)
    }
    mountedViews.delete(viewKey)
  }

  // Clear the container
  if (pluginContainer.value) {
    pluginContainer.value.innerHTML = ''
  }
}

// Watch for view changes
watch(activePluginView, async (newView, oldView) => {
  errorMessage.value = null
  isLoading.value = false

  // Unmount the previous view if any
  if (oldView) {
    await unmountCurrentView()
  }

  // Mount the new view if available
  if (newView && newView.onMount) {
    await nextTick()
    await mountPluginView(newView)
  }
})

// Cleanup on unmount
onUnmounted(async () => {
  await unmountCurrentView()
  mountedViews.clear()
})
</script>

<template>
  <div :class="cn('flex flex-col h-full', props.class)">
    <!-- Plugin Panel Header -->
    <div
      v-if="isShowingPluginContent"
      class="flex items-center justify-between p-3 border-b border-border bg-muted/30"
    >
      <div class="flex items-center gap-2 min-w-0">
        <!-- Plugin View Icon -->
        <div
          v-if="activePluginView?.icon"
          class="flex-shrink-0 w-4 h-4 flex items-center justify-center"
        >
          <span :class="activePluginView.icon" />
        </div>

        <!-- Plugin View Title -->
        <h3 class="text-sm font-medium truncate">
          {{ panelTitle }}
        </h3>

        <!-- Plugin ID Badge -->
        <span class="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex-shrink-0">
          {{ activePluginView?.pluginId }}
        </span>
      </div>

      <div class="flex items-center gap-1">
        <!-- View Switcher Dropdown -->
        <DropdownMenu v-if="availableViews.length > 1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as-child>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon" class="h-6 w-6">
                    <span class="icon-[lucide--chevron-down] w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom"> Switch Plugin View </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenuContent align="end" class="w-56">
            <DropdownMenuLabel>Plugin Views</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <template v-for="[pluginId, views] in viewsByPlugin" :key="pluginId">
              <DropdownMenuLabel class="text-xs text-muted-foreground px-2 py-1">
                {{ pluginId }}
              </DropdownMenuLabel>

              <DropdownMenuItem
                v-for="view in views"
                :key="`${view.pluginId}:${view.id}`"
                class="flex items-center gap-2"
                :class="{ 'bg-accent': view.isActive }"
                @click="handleViewChange(view.pluginId, view.id)"
              >
                <span v-if="view.icon" :class="view.icon" class="w-4 h-4" />
                <span class="flex-1">{{ view.label }}</span>
                <span v-if="view.isActive" class="icon-[lucide--check] w-3 h-3" />
              </DropdownMenuItem>

              <DropdownMenuSeparator
                v-if="Array.from(viewsByPlugin.keys()).indexOf(pluginId) < viewsByPlugin.size - 1"
              />
            </template>
          </DropdownMenuContent>
        </DropdownMenu>

        <!-- Close View Button -->
        <TooltipProvider v-if="canClosePanel">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="ghost" size="icon" class="h-6 w-6" @click="handleCloseView">
                <span class="icon-[lucide--x] w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom"> Close Plugin View </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>

    <!-- Content Area -->
    <div class="flex-1 min-h-0">
      <!-- Plugin Content -->
      <div v-if="isShowingPluginContent" class="h-full">
        <!-- Loading State -->
        <div v-if="isLoading" class="flex items-center justify-center h-full">
          <div class="text-center space-y-2">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
            <p class="text-sm text-muted-foreground">Loading plugin view...</p>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="errorMessage" class="flex items-center justify-center h-full p-4">
          <div class="text-center space-y-3 max-w-sm">
            <div
              class="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto"
            >
              <span class="icon-[lucide--alert-triangle] w-6 h-6 text-destructive" />
            </div>
            <div>
              <h4 class="text-sm font-medium text-foreground mb-1">Plugin Error</h4>
              <p class="text-xs text-muted-foreground">{{ errorMessage }}</p>
            </div>
            <Button variant="outline" size="sm" @click="errorMessage = null"> Dismiss </Button>
          </div>
        </div>

        <!-- Plugin Container -->
        <ErrorBoundary v-else-if="activePluginView" @error="handlePluginError">
          <ScrollArea class="h-full">
            <div class="p-4">
              <!-- DOM Container for Plugin UI -->
              <div ref="pluginContainer" class="plugin-content-container w-full h-full" />
            </div>
          </ScrollArea>
        </ErrorBoundary>
      </div>

      <!-- Default Content (when no plugin view is active) -->
      <div v-else class="h-full flex items-center justify-center">
        <div class="text-center space-y-4 max-w-sm p-4">
          <div class="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <span class="icon-[lucide--puzzle] w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 class="text-sm font-medium mb-2">Plugin Panel</h3>
            <p class="text-xs text-muted-foreground mb-4">
              This panel will display plugin interfaces when activated. Install and enable plugins
              to see their views here.
            </p>
          </div>

          <!-- Show available views if any -->
          <div v-if="availableViews.length > 0" class="space-y-2">
            <p class="text-xs font-medium">Available Plugin Views:</p>
            <div class="space-y-1">
              <Button
                v-for="view in availableViews.slice(0, 3)"
                :key="`${view.pluginId}:${view.id}`"
                variant="outline"
                size="sm"
                class="w-full justify-start"
                @click="handleViewChange(view.pluginId, view.id)"
              >
                <span v-if="view.icon" :class="view.icon" class="w-3 h-3 mr-2" />
                {{ view.label }}
              </Button>

              <p v-if="availableViews.length > 3" class="text-xs text-muted-foreground">
                +{{ availableViews.length - 3 }} more views available
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar for plugin content */
:deep(.plugin-scroll-area [data-reka-scroll-area-viewport]) {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--border)) transparent;
}

:deep(.plugin-scroll-area [data-reka-scroll-area-viewport]::-webkit-scrollbar) {
  width: 6px;
}

:deep(.plugin-scroll-area [data-reka-scroll-area-viewport]::-webkit-scrollbar-track) {
  background: transparent;
}

:deep(.plugin-scroll-area [data-reka-scroll-area-viewport]::-webkit-scrollbar-thumb) {
  background-color: hsl(var(--border));
  border-radius: 3px;
}

:deep(.plugin-scroll-area [data-reka-scroll-area-viewport]::-webkit-scrollbar-thumb:hover) {
  background-color: hsl(var(--border) / 0.8);
}

/* Ensure plugin content takes full space */
.plugin-content-container {
  min-height: 300px; /* Minimum height for plugin content */
}
</style>
