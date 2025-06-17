<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import {
  pluginManager,
  themeService,
  keyboardShortcutService
} from '@renderer/core/services/service-container'
import type { PluginInfo } from '@shared/types/types'
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

// Import settings components
import ApplicationSettings from './settings/ApplicationSettings.vue'
import AppearanceSettings from './settings/AppearanceSettings.vue'
import PluginsSettings from './settings/PluginsSettings.vue'
import MediaLibrarySettings from './settings/MediaLibrarySettings.vue'
import KeyboardShortcutsSettings from './settings/KeyboardShortcutsSettings.vue'
import PlaceholderSettings from './settings/PlaceholderSettings.vue'

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
            <!-- Dynamic component rendering based on active section -->
            <ApplicationSettings v-if="activeSection === 'Application'" />
            <AppearanceSettings v-else-if="activeSection === 'Appearance'" />
            <PluginsSettings
              v-else-if="activeSection === 'Plugins'"
              :plugins="plugins"
              :loading-plugins="loadingPlugins"
              @toggle-plugin="togglePlugin"
            />
            <MediaLibrarySettings v-else-if="activeSection === 'Media Library'" />
            <KeyboardShortcutsSettings
              v-else-if="activeSection === 'Keyboard Shortcuts'"
              v-model:search-query="searchQuery"
              v-model:new-keys-input="newKeysInput"
              :editing-shortcut="editingShortcut"
              :filtered-shortcuts="filteredShortcuts"
              :shortcuts-by-category="shortcutsByCategory"
              @start-editing-shortcut="startEditingShortcut"
              @cancel-editing-shortcut="cancelEditingShortcut"
              @save-shortcut-keys="saveShortcutKeys"
              @toggle-shortcut="toggleShortcut"
              @reset-shortcut-to-default="resetShortcutToDefault"
            />
            <PlaceholderSettings v-else :section-name="activeSection" />
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
</style>
