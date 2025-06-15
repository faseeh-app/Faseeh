<script setup lang="ts">
import { ref, watch } from 'vue'
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

function handleSectionClick(section: SettingsSection) {
  activeSection.value = section.name
}

function handleClose(newValue: boolean) {
  open.value = newValue
  if (!newValue) {
    emit('close')
  }
}

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
                  <label class="text-sm font-medium">Language</label>
                  <select
                    class="w-full max-w-xs rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option>English</option>
                    <option>Arabic</option>
                    <option>French</option>
                  </select>
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium">Auto-save interval</label>
                  <select
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
                <div class="space-y-2">
                  <label class="text-sm font-medium">Color Theme</label>
                  <div class="flex gap-2">
                    <button
                      class="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-primary bg-background"
                    >
                      <span class="text-sm">Light</span>
                    </button>
                    <button
                      class="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-muted bg-gray-900 text-white"
                    >
                      <span class="text-sm">Dark</span>
                    </button>
                    <button
                      class="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-muted bg-gradient-to-br from-background to-gray-900"
                    >
                      <span class="text-sm">Auto</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Media Library Settings -->
            <div v-else-if="activeSection === 'Media Library'" class="space-y-6">
              <div class="space-y-4">
                <h3 class="text-lg font-semibold">Library Management</h3>
                <div class="space-y-2">
                  <label class="text-sm font-medium">Default view</label>
                  <select
                    class="w-full max-w-xs rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option>Grid view</option>
                    <option>List view</option>
                    <option>Card view</option>
                  </select>
                </div>
                <div class="flex items-center space-x-2">
                  <input type="checkbox" id="auto-organize" class="rounded border-input" />
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
