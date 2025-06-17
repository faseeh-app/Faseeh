<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import {
  pluginManager,
  themeService,
  keyboardShortcutService
} from '@renderer/core/services/service-container'
import type { PluginInfo } from '@shared/types/types'
import type { Theme } from '@renderer/core/services/theme/theme.service'
import type {
  KeyboardShortcut,
  ShortcutCategory
} from '@renderer/core/services/keyboard/keyboard-shortcut-service'
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

// Keyboard shortcuts management state
const editingShortcut = ref<string | null>(null)
const newKeysInput = ref('')
const searchQuery = ref('')

// Reactive shortcuts and categories from the service
const shortcuts = keyboardShortcutService.shortcutsArray
const shortcutCategories = keyboardShortcutService.categoriesArray

// Reactive computed shortcuts filtered by search
const filteredShortcuts = keyboardShortcutService.createFilteredShortcuts(searchQuery)

// Reactive shortcuts grouped by category
const shortcutsByCategory = keyboardShortcutService.createShortcutsByCategory(filteredShortcuts)

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
  // Listen for plugin list updates (this is emitted whenever the plugin list changes)
  const cleanup1 = pluginManager().on('plugin:listUpdated', (updatedPlugins) => {
    plugins.value = updatedPlugins
  })

  pluginEventCleanups = [cleanup1]
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

// Keyboard shortcuts management functions
function startEditingShortcut(shortcutId: string): void {
  editingShortcut.value = shortcutId
  const shortcut = keyboardShortcutService.getShortcut(shortcutId)
  if (shortcut) {
    newKeysInput.value = shortcut.keys.join(', ')
  }
}

function cancelEditingShortcut(): void {
  editingShortcut.value = null
  newKeysInput.value = ''
}

async function saveShortcutKeys(shortcutId: string): Promise<void> {
  const newKeys = newKeysInput.value
    .split(',')
    .map((key) => key.trim())
    .filter((key) => key.length > 0)

  if (newKeys.length === 0) return
  const success = await keyboardShortcutService.updateShortcutKeys(shortcutId, newKeys)
  if (success) {
    cancelEditingShortcut()
  } else {
    // Handle conflict or error
    console.warn('Failed to update shortcut keys - possible conflict')
  }
}

function toggleShortcut(shortcutId: string): void {
  const shortcut = keyboardShortcutService.getShortcut(shortcutId)
  if (!shortcut) return

  if (shortcut.enabled) {
    keyboardShortcutService.disableShortcut(shortcutId)
  } else {
    keyboardShortcutService.enableShortcut(shortcutId)
  }
}

function resetShortcutToDefault(shortcutId: string): void {
  // This would need default shortcuts to be stored somewhere
  // For now, just a placeholder
  console.log('Reset shortcut to default:', shortcutId)
}

function getShortcutConflicts(shortcut: KeyboardShortcut): string[] {
  const conflicts = keyboardShortcutService.findConflicts(shortcut)
  return conflicts.map((conflict) =>
    conflict.shortcut1.id === shortcut.id ? conflict.shortcut2.name : conflict.shortcut1.name
  )
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
  // Load initial plugins list
  plugins.value = pluginManager().listPlugins()
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
    <DialogContent
      class="overflow-hidden p-0 h-[90vh] w-[95vw] max-w-[1200px] sm:max-w-[800px] md:max-w-[900px] lg:max-w-[1100px] xl:max-w-[1200px] border-input"
    >
      <DialogTitle class="sr-only"> Settings </DialogTitle>
      <DialogDescription class="sr-only">
        Customize your Faseeh application settings.
      </DialogDescription>
      <SidebarProvider class="items-start h-full">
        <Sidebar collapsible="none" class="hidden sm:flex w-64 lg:w-72">
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
        <main class="flex flex-1 flex-col overflow-hidden h-full">
          <!-- Mobile navigation for small screens -->
          <div class="sm:hidden border-b border-border px-4 py-2">
            <select
              v-model="activeSection"
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option v-for="section in settingsSections" :key="section.name" :value="section.name">
                {{ section.name }}
              </option>
            </select>
          </div>

          <header class="flex h-12 shrink-0 items-center gap-2">
            <div class="flex items-center gap-2 px-4">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem class="hidden sm:block">
                    <BreadcrumbLink href="#" @click.prevent> Settings </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator class="hidden sm:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{{ activeSection }}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div class="flex-1 overflow-y-auto scrollbar-hide p-4 pt-0">
            <!-- Application Settings -->
            <div v-if="activeSection === 'Application'" class="space-y-8">
              <div class="space-y-8">
                <div>
                  <h3 class="text-xl font-semibold mb-6">General</h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-2">
                      <label for="language-select" class="block text-sm font-medium"
                        >Language</label
                      >
                      <select
                        id="language-select"
                        class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option>English</option>
                        <option>Arabic</option>
                        <option>French</option>
                      </select>
                    </div>
                    <div class="space-y-2">
                      <label for="autosave-select" class="block text-sm font-medium"
                        >Auto-save interval</label
                      >
                      <select
                        id="autosave-select"
                        class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option>Every 5 minutes</option>
                        <option>Every 10 minutes</option>
                        <option>Every 30 minutes</option>
                        <option>Disabled</option>
                      </select>
                    </div>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div class="flex items-center space-x-3">
                      <input
                        id="startup-option"
                        type="checkbox"
                        class="rounded border-input w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
                      />
                      <label for="startup-option" class="text-sm font-medium">
                        Start with system
                      </label>
                    </div>
                    <div class="flex items-center space-x-3">
                      <input
                        id="minimize-tray"
                        type="checkbox"
                        class="rounded border-input w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
                      />
                      <label for="minimize-tray" class="text-sm font-medium">
                        Minimize to system tray
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <!-- Appearance Settings -->
            <div v-else-if="activeSection === 'Appearance'" class="space-y-8">
              <div class="space-y-8">
                <div>
                  <h3 class="text-xl font-semibold mb-6">Theme</h3>
                  <div class="space-y-6">
                    <div class="space-y-4">
                      <div>
                        <span class="block text-sm font-medium mb-1">Color Theme</span>
                        <p class="text-xs text-muted-foreground">
                          Choose between light, dark, or auto theme based on your system preference.
                        </p>
                      </div>
                      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
                        <button
                          v-for="theme in ['light', 'dark', 'auto'] as Theme[]"
                          :key="theme"
                          :class="[
                            'flex flex-col items-center justify-center gap-3 p-6 rounded-lg border-2 transition-all hover:scale-105',
                            currentTheme === theme
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-border hover:border-border/60'
                          ]"
                          @click="handleThemeChange(theme)"
                        >
                          <component
                            :is="getThemeIcon(theme)"
                            :class="[
                              'h-8 w-8',
                              currentTheme === theme ? 'text-primary' : 'text-muted-foreground'
                            ]"
                          />
                          <span class="text-sm font-medium">{{ getThemeLabel(theme) }}</span>
                          <span v-if="theme === 'auto'" class="text-xs text-muted-foreground">
                            ({{ effectiveTheme }})
                          </span>
                        </button>
                      </div>
                    </div>
                    <div class="p-4 rounded-md bg-muted/50">
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
            </div>
            <!-- Plugins Settings -->
            <div v-else-if="activeSection === 'Plugins'" class="space-y-8">
              <div class="space-y-8">
                <div>
                  <h3 class="text-xl font-semibold">Plugin Management</h3>
                  <p class="text-sm text-muted-foreground mt-2">
                    Manage community plugins to extend Faseeh's functionality with custom content
                    adapters, metadata scrapers, and other features.
                  </p>
                </div>

                <div v-if="plugins.length === 0" class="text-center py-16">
                  <Package class="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                  <p class="text-sm text-muted-foreground">No plugins found</p>
                  <p class="text-xs text-muted-foreground mt-1">
                    Install plugins in the plugins directory to get started
                  </p>
                </div>

                <div v-else class="space-y-4">
                  <div
                    v-for="plugin in plugins"
                    :key="plugin.manifest.id"
                    class="flex flex-col sm:flex-row sm:items-center justify-between p-6 border rounded-lg hover:bg-muted/50 transition-colors gap-4"
                  >
                    <div class="flex-1 min-w-0">
                      <div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                        <h4 class="font-medium text-lg">{{ plugin.manifest.name }}</h4>
                        <span
                          :class="[
                            'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shrink-0 w-fit',
                            getPluginStatusClasses(plugin)
                          ]"
                        >
                          <CheckCircle v-if="plugin.isLoaded" class="w-3 h-3 mr-1" />
                          <AlertTriangle v-else-if="plugin.hasFailed" class="w-3 h-3 mr-1" />
                          {{ getPluginStatusBadge(plugin).text }}
                        </span>
                      </div>

                      <p class="text-sm text-muted-foreground mb-3">
                        {{ plugin.manifest.description }}
                      </p>

                      <div class="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span>v{{ plugin.manifest.version }}</span>
                        <span>ID: {{ plugin.manifest.id }}</span>
                        <span v-if="plugin.manifest.author">by {{ plugin.manifest.author }}</span>
                      </div>

                      <div
                        v-if="plugin.hasFailed && plugin.error"
                        class="mt-3 text-xs text-destructive bg-destructive/10 p-3 rounded"
                      >
                        Error: {{ plugin.error }}
                      </div>
                    </div>

                    <div class="flex items-center gap-3 sm:ml-4">
                      <Loader2
                        v-if="loadingPlugins.includes(plugin.manifest.id)"
                        class="w-5 h-5 animate-spin text-muted-foreground"
                      />
                      <Button
                        v-else
                        :variant="plugin.isEnabled ? 'default' : 'outline'"
                        size="default"
                        :disabled="loadingPlugins.includes(plugin.manifest.id)"
                        @click="togglePlugin(plugin)"
                        class="w-20"
                      >
                        {{ plugin.isEnabled ? 'Disable' : 'Enable' }}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <!-- Media Library Settings -->
            <div v-else-if="activeSection === 'Media Library'" class="space-y-8">
              <div class="space-y-8">
                <div>
                  <h3 class="text-xl font-semibold mb-6">Library Management</h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-2">
                      <label for="view-select" class="block text-sm font-medium"
                        >Default view</label
                      >
                      <select
                        id="view-select"
                        class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option>Grid view</option>
                        <option>List view</option>
                        <option>Card view</option>
                      </select>
                    </div>
                    <div class="space-y-2">
                      <label for="items-per-page" class="block text-sm font-medium"
                        >Items per page</label
                      >
                      <select
                        id="items-per-page"
                        class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option>25</option>
                        <option>50</option>
                        <option>100</option>
                        <option>200</option>
                      </select>
                    </div>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div class="flex items-center space-x-3">
                      <input
                        id="auto-organize"
                        type="checkbox"
                        class="rounded border-input w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
                      />
                      <label for="auto-organize" class="text-sm font-medium">
                        Auto-organize imported files
                      </label>
                    </div>
                    <div class="flex items-center space-x-3">
                      <input
                        id="auto-metadata"
                        type="checkbox"
                        class="rounded border-input w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
                      />
                      <label for="auto-metadata" class="text-sm font-medium">
                        Auto-extract metadata
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <!-- Keyboard Shortcuts Settings -->
            <div v-else-if="activeSection === 'Keyboard Shortcuts'" class="h-full flex flex-col">
              <!-- Fixed header section -->
              <div class="shrink-0 pb-4 border-b border-border mb-4">
                <div>
                  <h3 class="text-xl font-semibold">Keyboard Shortcuts</h3>
                  <p class="text-sm text-muted-foreground mt-1">
                    Customize keyboard shortcuts for faster navigation and actions.
                  </p>
                </div>

                <!-- Search shortcuts -->
                <div class="mt-4">
                  <label for="shortcut-search" class="block text-sm font-medium mb-2"
                    >Search shortcuts</label
                  >
                  <input
                    id="shortcut-search"
                    v-model="searchQuery"
                    type="text"
                    placeholder="Search by name, description, or key combination..."
                    class="w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              <!-- Scrollable shortcuts list -->
              <div class="flex-1 overflow-y-auto scrollbar-hide pr-2">
                <!-- No shortcuts found -->
                <div v-if="Object.keys(shortcutsByCategory).length === 0" class="text-center py-8">
                  <Package class="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p class="text-sm text-muted-foreground">No shortcuts found</p>
                </div>

                <!-- Shortcuts by category -->
                <div v-else class="space-y-3 pb-4">
                  <div v-for="(categoryShortcuts, category) in shortcutsByCategory" :key="category">
                    <h4
                      class="font-medium text-sm mb-2 text-muted-foreground uppercase tracking-wide"
                    >
                      {{ category }}
                    </h4>
                    <div class="space-y-1.5">
                      <div
                        v-for="shortcut in categoryShortcuts"
                        :key="shortcut.id"
                        :class="[
                          'flex flex-col lg:flex-row lg:items-center justify-between p-2.5 rounded-md border transition-colors gap-2',
                          shortcut.enabled ? 'hover:bg-muted/50' : 'opacity-60 bg-muted/30'
                        ]"
                      >
                        <div class="flex-1 min-w-0">
                          <div class="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                            <h5 class="font-medium text-sm">{{ shortcut.name }}</h5>
                            <div class="flex items-center gap-1">
                              <span
                                v-if="!shortcut.enabled"
                                class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                              >
                                Disabled
                              </span>
                              <span
                                v-if="getShortcutConflicts(shortcut).length > 0"
                                class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              >
                                <AlertTriangle class="w-3 h-3 mr-1" />
                                Conflict
                              </span>
                            </div>
                          </div>

                          <p class="text-xs text-muted-foreground mb-1.5">
                            {{ shortcut.description }}
                          </p>

                          <div class="flex flex-col sm:flex-row sm:items-center gap-2">
                            <div class="flex items-center gap-1 flex-wrap">
                              <span
                                v-for="(key, index) in shortcut.keys"
                                :key="index"
                                class="inline-flex items-center gap-1"
                              >
                                <kbd
                                  class="px-1.5 py-0.5 text-xs font-mono bg-muted rounded border"
                                >
                                  {{ keyboardShortcutService.formatKeyCombo(key) }}
                                </kbd>
                                <span
                                  v-if="index < shortcut.keys.length - 1"
                                  class="text-muted-foreground text-xs"
                                  >or</span
                                >
                              </span>
                            </div>

                            <!-- Edit mode -->
                            <div
                              v-if="editingShortcut === shortcut.id"
                              class="flex items-center gap-1.5"
                            >
                              <input
                                v-model="newKeysInput"
                                type="text"
                                placeholder="ctrl+shift+t, ctrl+t"
                                class="px-2 py-1 text-xs border border-input rounded focus:outline-none focus:ring-1 focus:ring-primary min-w-40"
                                @keydown.enter="saveShortcutKeys(shortcut.id)"
                                @keydown.escape="cancelEditingShortcut"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                @click="saveShortcutKeys(shortcut.id)"
                                class="h-6 w-6 p-0"
                              >
                                <CheckCircle class="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                @click="cancelEditingShortcut"
                                class="h-6 w-6 p-0"
                              >
                                <AlertTriangle class="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          <!-- Show conflicts -->
                          <div
                            v-if="getShortcutConflicts(shortcut).length > 0"
                            class="mt-1.5 text-xs text-destructive bg-destructive/10 p-1.5 rounded"
                          >
                            Conflicts with: {{ getShortcutConflicts(shortcut).join(', ') }}
                          </div>
                        </div>

                        <div class="flex items-center gap-1.5 lg:ml-3">
                          <!-- Edit button -->
                          <Button
                            v-if="editingShortcut !== shortcut.id"
                            variant="ghost"
                            size="sm"
                            @click="startEditingShortcut(shortcut.id)"
                            class="h-7 px-2 text-xs"
                          >
                            Edit
                          </Button>

                          <!-- Enable/Disable toggle -->
                          <Button
                            :variant="shortcut.enabled ? 'default' : 'outline'"
                            size="sm"
                            @click="toggleShortcut(shortcut.id)"
                            class="h-7 px-2 text-xs w-14"
                          >
                            {{ shortcut.enabled ? 'Disable' : 'Enable' }}
                          </Button>

                          <!-- Reset button -->
                          <Button
                            variant="ghost"
                            size="sm"
                            @click="resetShortcutToDefault(shortcut.id)"
                            class="h-7 px-2 text-xs"
                          >
                            Reset
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <!-- Default placeholder for other sections -->
            <div v-else class="space-y-8">
              <div class="space-y-8">
                <div>
                  <h3 class="text-xl font-semibold mb-6">{{ activeSection }}</h3>
                  <p class="text-sm text-muted-foreground mb-8">
                    Settings for {{ activeSection.toLowerCase() }} will be available here.
                  </p>
                  <div class="grid gap-6">
                    <div
                      v-for="i in 3"
                      :key="i"
                      class="h-20 rounded-lg bg-muted/50 animate-pulse"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </SidebarProvider>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
/* Hide scrollbars while maintaining functionality */
.scrollbar-hide {
  /* Hide scrollbar for Chrome, Safari and Opera */
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* Internet Explorer 10+ */
}

.scrollbar-hide::-webkit-scrollbar {
  display: none; /* WebKit */
}

/* Override shadcn dialog border colors with Faseeh theme colors */
:deep([data-slot='dialog-content']) {
  border-color: var(--faseeh-border-primary) !important;
  background-color: var(--faseeh-background-primary) !important;
}

/* Additional dialog content targeting */
:deep(.dialog-content),
:deep([data-radix-dialog-content]) {
  border-color: var(--faseeh-border-primary) !important;
  background-color: var(--faseeh-background-primary) !important;
}

/* Target the specific classes used by shadcn */
:deep(.bg-background) {
  background-color: var(--faseeh-background-primary) !important;
}

:deep(.border) {
  border-color: var(--faseeh-border-primary) !important;
}

/* Override any input field borders */
:deep(.input),
:deep(input[type='text']),
:deep(input[type='email']),
:deep(input[type='password']),
:deep(select),
:deep(textarea) {
  border-color: var(--faseeh-border-primary) !important;
  background-color: var(--faseeh-background-primary) !important;
}

:deep(.input:focus),
:deep(input:focus),
:deep(select:focus),
:deep(textarea:focus) {
  border-color: var(--faseeh-border-interactive) !important;
  --tw-ring-color: var(--faseeh-border-interactive) !important;
}

/* Override card borders */
:deep(.card) {
  border-color: var(--faseeh-border-secondary) !important;
  background-color: var(--faseeh-background-secondary) !important;
}

/* Override sidebar borders */
:deep(.sidebar) {
  border-color: var(--faseeh-border-primary) !important;
  background-color: var(--faseeh-background-secondary) !important;
}

/* Override button borders */
:deep(.button),
:deep(button) {
  border-color: var(--faseeh-border-primary) !important;
}

:deep(.button:hover),
:deep(button:hover) {
  border-color: var(--faseeh-border-interactive) !important;
}

/* Override select and other form control borders */
:deep(.select) {
  border-color: var(--faseeh-border-primary) !important;
}

:deep(.select:focus) {
  border-color: var(--faseeh-border-interactive) !important;
}

/* Ensure white borders are completely overridden */
:deep(*) {
  border-color: var(--faseeh-border-primary) !important;
}

/* But allow transparent borders */
:deep([style*='border-color: transparent']),
:deep(.border-transparent) {
  border-color: transparent !important;
}
</style>
