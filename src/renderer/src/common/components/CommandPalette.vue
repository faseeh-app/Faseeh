<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { createReusableTemplate, useMediaQuery, useMagicKeys } from '@vueuse/core'
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator
} from '@renderer/common/components/ui/command'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '@renderer/common/components/ui/drawer'
import { Button } from '@renderer/common/components/ui/button'
import { themeService, keyboardShortcutService } from '@renderer/core/services/service-container'
import type { KeyboardShortcut } from '@renderer/core/services/keyboard/keyboard-shortcut-service'

interface CommandAction {
  id: string
  title: string
  description?: string
  keywords?: string[]
  category?: string
  shortcut?: string
  action: () => void
}

interface Props {
  isOpen: boolean
  placeholder?: string
  openSettings?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Type a command or search...'
})

const emit = defineEmits<{
  close: []
}>()

const [UseCommandTemplate, CommandContent] = createReusableTemplate()

// Responsive breakpoint - matches Tailwind's md breakpoint
const isDesktop = useMediaQuery('(min-width: 768px)')

const open = ref(false)
const searchQuery = ref('')

// Get commands from keyboard shortcut service
const allShortcuts = ref<KeyboardShortcut[]>([])
const staticCommands: CommandAction[] = [
  {
    id: 'search-media',
    title: 'Search Media',
    description: 'Search through your media library',
    keywords: ['search', 'find', 'media', 'library'],
    category: 'Media',
    action: () => {
      console.log('Search media action')
      handleOpenChange()
    }
  },
  {
    id: 'import-media',
    title: 'Import Media',
    description: 'Import new media files',
    keywords: ['import', 'add', 'upload', 'file'],
    category: 'Media',
    action: () => {
      console.log('Import media action')
      handleOpenChange()
    }
  },
  {
    id: 'create-collection',
    title: 'Create Collection',
    description: 'Create a new media collection',
    keywords: ['create', 'collection', 'folder', 'organize'],
    category: 'Organization',
    action: () => {
      console.log('Create collection action')
      handleOpenChange()
    }
  },
  {
    id: 'open-settings',
    title: 'Open Settings',
    description: 'Configure application settings',
    keywords: ['settings', 'preferences', 'configure', 'options'],
    category: 'Application',
    action: () => {
      if (props.openSettings) {
        props.openSettings()
      }
      handleOpenChange()
    }
  }
]

// Combine static commands with shortcuts from service
const commands = computed(() => {
  const shortcutCommands: CommandAction[] = allShortcuts.value.map((shortcut) => ({
    id: shortcut.id,
    title: shortcut.name,
    description: shortcut.description,
    keywords: [shortcut.name.toLowerCase(), shortcut.description.toLowerCase(), shortcut.category],
    category: shortcut.category.charAt(0).toUpperCase() + shortcut.category.slice(1),
    shortcut: shortcut.keys.map((key) => keyboardShortcutService.formatKeyCombo(key)).join(', '),
    action: () => {
      shortcut.handler()
      handleOpenChange()
    }
  }))

  return [...staticCommands, ...shortcutCommands]
})

// Group commands by category
const groupedCommands = computed(() => {
  const groups: Record<string, CommandAction[]> = {}

  commands.value.forEach((command) => {
    const category = command.category || 'Other'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(command)
  })

  return groups
})

// Keyboard shortcut support
const keys = useMagicKeys()
const CmdJ = keys['Cmd+J']
const CtrlJ = keys['Ctrl+J']

// Watch for keyboard shortcuts
watch([CmdJ, CtrlJ], ([cmdJ, ctrlJ]) => {
  if ((cmdJ || ctrlJ) && !open.value) {
    // Only open when currently closed to prevent immediate reopening
    handleOpenChange()
  }
})

onMounted(() => {
  loadShortcuts()

  // Listen for shortcuts changes
  keyboardShortcutService.on('shortcut:registered', loadShortcuts)
  keyboardShortcutService.on('shortcut:unregistered', loadShortcuts)
})

function loadShortcuts() {
  allShortcuts.value = keyboardShortcutService.getAllShortcuts()
}

function handleOpenChange() {
  open.value = !open.value
  if (!open.value) {
    emit('close')
  }
}

function handleClose(newValue: boolean) {
  open.value = newValue
  if (!newValue) {
    emit('close')
  }
}

function handleCommandSelect(event: any) {
  const commandId = event.detail?.value || event
  const command = commands.value.find((cmd) => cmd.id === commandId)
  if (command) {
    command.action()
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
  <UseCommandTemplate>
    <div class="faseeh-command-palette__container">
      <CommandInput :placeholder="placeholder" />
      <CommandList class="faseeh-command-palette__list">
        <CommandEmpty>No commands found.</CommandEmpty>
        <template v-for="(categoryCommands, category) in groupedCommands" :key="category">
          <CommandGroup :heading="category">
            <CommandItem
              v-for="command in categoryCommands"
              :key="command.id"
              :value="command.id"
              @select="handleCommandSelect"
            >
              <div class="faseeh-command-palette__command-content">
                <div class="flex-1">
                  <span class="faseeh-command-palette__command-title">{{ command.title }}</span>
                  <span
                    v-if="command.description"
                    class="faseeh-command-palette__command-description"
                  >
                    {{ command.description }}
                  </span>
                </div>
                <kbd
                  v-if="command.shortcut"
                  class="faseeh-command-palette__kbd faseeh-command-palette__command-shortcut"
                >
                  {{ command.shortcut }}
                </kbd>
              </div>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator
            v-if="
              Object.keys(groupedCommands).indexOf(category) <
              Object.keys(groupedCommands).length - 1
            "
          />
        </template>
      </CommandList>

      <div v-if="isDesktop" class="faseeh-command-palette__footer">
        <div class="faseeh-command-palette__footer-content">
          <div class="faseeh-command-palette__shortcuts-group--main">
            <div class="faseeh-command-palette__shortcut-item">
              <kbd class="faseeh-command-palette__kbd"> ↑↓ </kbd>
              <span class="faseeh-command-palette__shortcut-label">navigate</span>
            </div>
            <div class="faseeh-command-palette__shortcut-item">
              <kbd class="faseeh-command-palette__kbd"> ↵ </kbd>
              <span class="faseeh-command-palette__shortcut-label">select</span>
            </div>
            <div class="faseeh-command-palette__shortcut-item">
              <kbd class="faseeh-command-palette__kbd"> esc </kbd>
              <span class="faseeh-command-palette__shortcut-label">close</span>
            </div>
          </div>
          <div class="faseeh-command-palette__shortcuts-group--toggle">
            <kbd class="faseeh-command-palette__kbd"> ⌘J </kbd>
            <span class="faseeh-command-palette__shortcut-label">toggle</span>
          </div>
        </div>
      </div>
    </div>
  </UseCommandTemplate>
  <!-- Desktop Dialog -->
  <CommandDialog v-if="isDesktop" :open="open" @update:open="handleClose">
    <CommandContent />
  </CommandDialog>
  <!-- Mobile Drawer -->
  <Drawer v-else :open="open" @update:open="handleClose">
    <DrawerContent class="faseeh-command-palette__container">
      <DrawerHeader class="faseeh-command-palette__mobile-header">
        <DrawerTitle class="faseeh-command-palette__mobile-header-title"
          >Search Commands</DrawerTitle
        >
        <DrawerDescription class="faseeh-command-palette__mobile-header-description">
          Type a command or search through available actions.
        </DrawerDescription>
      </DrawerHeader>

      <Command class="faseeh-command-palette__mobile-command">
        <CommandList class="faseeh-command-palette__mobile-list-compact">
          <CommandEmpty class="faseeh-command-palette__mobile-empty"
            >No commands found.</CommandEmpty
          >
          <template v-for="(categoryCommands, category) in groupedCommands" :key="category">
            <CommandGroup :heading="category" class="faseeh-command-palette__mobile-group">
              <CommandItem
                v-for="command in categoryCommands"
                :key="command.id"
                :value="command.id"
                @select="handleCommandSelect"
                class="faseeh-command-palette__mobile-item"
              >
                <div class="faseeh-command-palette__mobile-content">
                  <span class="faseeh-command-palette__mobile-title">{{ command.title }}</span>
                  <span
                    v-if="command.description"
                    class="faseeh-command-palette__mobile-description"
                  >
                    {{ command.description }}
                  </span>
                </div>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator
              v-if="
                Object.keys(groupedCommands).indexOf(category) <
                Object.keys(groupedCommands).length - 1
              "
              class="faseeh-command-palette__mobile-separator"
            />
          </template>
        </CommandList>

        <CommandInput :placeholder="placeholder" class="faseeh-command-palette__mobile-input" />
      </Command>

      <DrawerFooter class="faseeh-command-palette__mobile-footer-compact">
        <DrawerClose as-child>
          <Button variant="outline" size="sm" class="faseeh-command-palette__mobile-close-button">
            Close
          </Button>
        </DrawerClose>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
</template>
