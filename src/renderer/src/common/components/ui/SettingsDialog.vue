<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { pluginManager, themeService } from '@renderer/core/services/service-container'
import type { PluginInfo } from '@shared/types/types'
import type { Theme } from '@renderer/core/services/theme/theme.service'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@renderer/common/components/ui/breadcrumb'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from '@renderer/common/components/ui/dialog'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider
} from '@renderer/common/components/ui/sidebar'
import { Button } from '@renderer/common/components/ui/button'
import { AlertTriangle, CheckCircle, Loader2, Package, Sun, Moon, Monitor } from 'lucide-vue-next'

interface SettingsSection {
  name: string
  icon: string
  activeIcon: string
}

interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const open = ref(false)
const activeSection = ref('Application')

// Plugin management state
const plugins = ref<PluginInfo[]>([])
const loadingPlugins = ref<string[]>([])

// Theme management state
const currentTheme = computed(() => themeService.currentTheme.value)
const effectiveTheme = computed(() => themeService.effectiveTheme.value)

// Event cleanup functions
let pluginEventCleanups: (() => void)[] = []

const settingsSections: SettingsSection[] = [
  {
    name: 'Application',
    icon: 'icon-[solar--settings-linear]',
    activeIcon: 'icon-[solar--settings-bold]'
  },
  {
    name: 'Appearance',
    icon: 'icon-[solar--palette-linear]',
    activeIcon: 'icon-[solar--palette-bold]'
  },
  {
    name: 'Plugins',
    icon: 'icon-[solar--widget-3-linear]',
    activeIcon: 'icon-[solar--widget-3-bold]'
  },
  {
    name: 'Media Library',
    icon: 'icon-[solar--library-linear]',
    activeIcon: 'icon-[solar--library-bold]'
  },
  {
    name: 'Import & Export',
    icon: 'icon-[solar--import-linear]',
    activeIcon: 'icon-[solar--import-bold]'
  },
  {
    name: 'OCR & Recognition',
    icon: 'icon-[solar--document-text-linear]',
    activeIcon: 'icon-[solar--document-text-bold]'
  },
  {
    name: 'Keyboard Shortcuts',
    icon: 'icon-[solar--keyboard-linear]',
    activeIcon: 'icon-[solar--keyboard-bold]'
  },
  {
    name: 'Privacy & Security',
    icon: 'icon-[solar--shield-check-linear]',
    activeIcon: 'icon-[solar--shield-check-bold]'
  },
  {
    name: 'Advanced',
    icon: 'icon-[solar--settings-minimalistic-linear]',
    activeIcon: 'icon-[solar--settings-minimalistic-bold]'
  }
]

// Plugin management functions
function loadPluginsList(): void {
  plugins.value = pluginManager().listPlugins()
}

async function togglePlugin(plugin: PluginInfo): Promise<void> {
  if (loadingPlugins.value.includes(plugin.manifest.id)) {
    return // Already processing
  }

  loadingPlugins.value.push(plugin.manifest.id)

  try {
    if (plugin.isEnabled) {
      await pluginManager().disablePlugin(plugin.manifest.id)
    } else {
      await pluginManager().enablePlugin(plugin.manifest.id)
    }
    // Plugin list will be updated automatically via events
  } catch (error) {
    console.error(`Failed to toggle plugin ${plugin.manifest.id}:`, error)
    // Note: Error feedback would be improved with a toast notification system
  } finally {
    loadingPlugins.value = loadingPlugins.value.filter((id) => id !== plugin.manifest.id)
  }
}

function getPluginStatusBadge(plugin: PluginInfo): {
  text: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
} {
  if (plugin.hasFailed) {
    return { text: 'Error', variant: 'destructive' as const }
  }
  if (!plugin.isEnabled) {
    return { text: 'Disabled', variant: 'secondary' as const }
  }
  if (plugin.isLoaded) {
    return { text: 'Active', variant: 'default' as const }
  }
  return { text: 'Enabled', variant: 'outline' as const }
}

function getPluginStatusClasses(plugin: PluginInfo): string {
  const badge = getPluginStatusBadge(plugin)
  switch (badge.variant) {
    case 'destructive':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    case 'secondary':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    case 'default':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'outline':
      return 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }
}

function setupPluginEvents(): void {
  // Listen for plugin list updates
  const cleanup1 = pluginManager().on('plugin:listUpdated', (updatedPlugins) => {
    plugins.value = updatedPlugins
  })

  const cleanup2 = pluginManager().on('plugin:enabled', () => {
    loadPluginsList()
  })

  const cleanup3 = pluginManager().on('plugin:disabled', () => {
    loadPluginsList()
  })

  pluginEventCleanups = [cleanup1, cleanup2, cleanup3]
}

function cleanupPluginEvents(): void {
  pluginEventCleanups.forEach((cleanup) => cleanup())
  pluginEventCleanups = []
}

// Theme management functions
function handleThemeChange(theme: Theme): void {
  themeService.setTheme(theme)
}

function getThemeIcon(theme: Theme): any {
  switch (theme) {
    case 'light':
      return Sun
    case 'dark':
      return Moon
    case 'auto':
      return Monitor
    default:
      return Monitor
  }
}

function getThemeLabel(theme: Theme): string {
  switch (theme) {
    case 'light':
      return 'Light'
    case 'dark':
      return 'Dark'
    case 'auto':
      return 'Auto'
    default:
      return 'Auto'
  }
}

function handleSectionClick(section: SettingsSection): void {
  activeSection.value = section.name
}

function handleClose(newValue: boolean): void {
  open.value = newValue
  if (!newValue) {
    emit('close')
  }
}

// Lifecycle hooks
onMounted(() => {
  loadPluginsList()
  setupPluginEvents()
})

onUnmounted(() => {
  cleanupPluginEvents()
})

// Watch for external prop changes
watch(
  () => props.isOpen,
  (newValue) => {
    open.value = newValue
  }
)
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]">
      <DialogTitle class="sr-only"> Settings </DialogTitle>
      <DialogDescription class="sr-only">
        Customize your Faseeh application settings.
      </DialogDescription>

      <SidebarProvider class="items-start">
        <Sidebar collapsible="none" class="hidden md:flex">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem v-for="section in settingsSections" :key="section.name">
                    <SidebarMenuButton as-child :is-active="section.name === activeSection">
                      <button class="w-full" @click="handleSectionClick(section)">
                        <span
                          :class="`faseeh-icon ${section.name === activeSection ? section.activeIcon : section.icon}`"
                        />
                        <span>{{ section.name }}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <main class="flex h-[480px] flex-1 flex-col overflow-hidden">
          <header
            class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12"
          >
            <div class="flex items-center gap-2 px-4">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem class="hidden md:block">
                    <BreadcrumbLink href="#" @click.prevent> Settings </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator class="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{{ activeSection }}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div class="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
            <!-- Application Settings -->
            <div v-if="activeSection === 'Application'" class="space-y-6">
              <div class="space-y-4">
                <h3 class="text-lg font-semibold">General</h3>
                <div class="space-y-2">
                  <label for="language-select" class="text-sm font-medium">Language</label>
                  <select
                    id="language-select"
                    class="w-full max-w-xs rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option>English</option>
                    <option>Arabic</option>
                    <option>French</option>
                  </select>
                </div>
                <div class="space-y-2">
                  <label for="autosave-select" class="text-sm font-medium"
                    >Auto-save interval</label
                  >
                  <select
                    id="autosave-select"
                    class="w-full max-w-xs rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option>Every 5 minutes</option>
                    <option>Every 10 minutes</option>
                    <option>Every 30 minutes</option>
                    <option>Disabled</option>
                  </select>
                </div>
              </div>
            </div>
            <!-- Appearance Settings -->
            <div v-else-if="activeSection === 'Appearance'" class="space-y-6">
              <div class="space-y-4">
                <h3 class="text-lg font-semibold">Theme</h3>
                <div class="space-y-4">
                  <div class="space-y-2">
                    <span class="text-sm font-medium">Color Theme</span>
                    <p class="text-xs text-muted-foreground">
                      Choose between light, dark, or auto theme based on your system preference.
                    </p>
                  </div>
                  <div class="grid grid-cols-3 gap-3 max-w-md">
                    <button
                      v-for="theme in ['light', 'dark', 'auto'] as Theme[]"
                      :key="theme"
                      :class="[
                        'flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all hover:scale-105',
                        currentTheme === theme
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:border-border/60'
                      ]"
                      @click="handleThemeChange(theme)"
                    >
                      <component
                        :is="getThemeIcon(theme)"
                        :class="[
                          'h-6 w-6',
                          currentTheme === theme ? 'text-primary' : 'text-muted-foreground'
                        ]"
                      />
                      <span class="text-sm font-medium">{{ getThemeLabel(theme) }}</span>
                      <span v-if="theme === 'auto'" class="text-xs text-muted-foreground">
                        ({{ effectiveTheme }})
                      </span>
                    </button>
                  </div>
                  <div class="mt-4 p-3 rounded-md bg-muted/50">
                    <p class="text-sm text-muted-foreground">
                      <strong>Current:</strong> {{ getThemeLabel(currentTheme) }}
                      <span v-if="currentTheme === 'auto'">
                        (using {{ effectiveTheme }} based on system preference)
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Plugins Settings -->
            <div v-else-if="activeSection === 'Plugins'" class="space-y-6">
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold">Plugin Management</h3>
                  <Button variant="outline" size="sm" @click="loadPluginsList">
                    <Package class="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                </div>
                <p class="text-sm text-muted-foreground">
                  Manage community plugins to extend Faseeh's functionality with custom content
                  adapters, metadata scrapers, and other features.
                </p>

                <div v-if="plugins.length === 0" class="text-center py-8">
                  <Package class="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p class="text-sm text-muted-foreground">No plugins found</p>
                  <p class="text-xs text-muted-foreground mt-1">
                    Install plugins in the plugins directory to get started
                  </p>
                </div>

                <div v-else class="space-y-3">
                  <div
                    v-for="plugin in plugins"
                    :key="plugin.manifest.id"
                    class="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-3 mb-2">
                        <h4 class="font-medium truncate">{{ plugin.manifest.name }}</h4>
                        <span
                          :class="[
                            'inline-flex items-center px-2 py-1 rounded text-xs font-medium shrink-0',
                            getPluginStatusClasses(plugin)
                          ]"
                        >
                          <CheckCircle v-if="plugin.isLoaded" class="w-3 h-3 mr-1" />
                          <AlertTriangle v-else-if="plugin.hasFailed" class="w-3 h-3 mr-1" />
                          {{ getPluginStatusBadge(plugin).text }}
                        </span>
                      </div>

                      <p class="text-sm text-muted-foreground mb-1">
                        {{ plugin.manifest.description }}
                      </p>

                      <div class="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>v{{ plugin.manifest.version }}</span>
                        <span>ID: {{ plugin.manifest.id }}</span>
                        <span v-if="plugin.manifest.author">by {{ plugin.manifest.author }}</span>
                      </div>

                      <div
                        v-if="plugin.hasFailed && plugin.error"
                        class="mt-2 text-xs text-destructive"
                      >
                        Error: {{ plugin.error }}
                      </div>
                    </div>

                    <div class="flex items-center gap-2 ml-4">
                      <Loader2
                        v-if="loadingPlugins.includes(plugin.manifest.id)"
                        class="w-4 h-4 animate-spin text-muted-foreground"
                      />
                      <Button
                        v-else
                        :variant="plugin.isEnabled ? 'default' : 'outline'"
                        size="sm"
                        :disabled="loadingPlugins.includes(plugin.manifest.id)"
                        @click="togglePlugin(plugin)"
                      >
                        {{ plugin.isEnabled ? 'Disable' : 'Enable' }}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Media Library Settings -->
            <div v-else-if="activeSection === 'Media Library'" class="space-y-6">
              <div class="space-y-4">
                <h3 class="text-lg font-semibold">Library Management</h3>
                <div class="space-y-2">
                  <label for="view-select" class="text-sm font-medium">Default view</label>
                  <select
                    id="view-select"
                    class="w-full max-w-xs rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option>Grid view</option>
                    <option>List view</option>
                    <option>Card view</option>
                  </select>
                </div>
                <div class="flex items-center space-x-2">
                  <input id="auto-organize" type="checkbox" class="rounded border-input" />
                  <label for="auto-organize" class="text-sm font-medium"
                    >Auto-organize imported files</label
                  >
                </div>
              </div>
            </div>

            <!-- Default placeholder for other sections -->
            <div v-else class="space-y-6">
              <div class="space-y-4">
                <h3 class="text-lg font-semibold">{{ activeSection }}</h3>
                <p class="text-sm text-muted-foreground">
                  Settings for {{ activeSection.toLowerCase() }} will be available here.
                </p>
                <div class="grid gap-4">
                  <div v-for="i in 3" :key="i" class="h-16 rounded-lg bg-muted/50" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </SidebarProvider>
    </DialogContent>
  </Dialog>
</template>
