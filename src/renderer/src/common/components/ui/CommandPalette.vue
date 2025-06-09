<script setup lang="ts">
import { ref, watch } from 'vue'
import { useMagicKeys } from '@vueuse/core'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator
} from '@renderer/common/components/ui/command'

interface CommandAction {
  id: string
  title: string
  description?: string
  keywords?: string[]
  category?: string
  action: () => void
}

interface Props {
  isOpen: boolean
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Type a command or search...'
})

const emit = defineEmits<{
  close: []
}>()

// Convert isOpen prop to local reactive state for CommandDialog
const open = ref(false)

// Keyboard shortcut support
const keys = useMagicKeys()
const CmdJ = keys['Cmd+J']
const CtrlJ = keys['Ctrl+J']

// Watch for keyboard shortcuts
watch([CmdJ, CtrlJ], ([cmdJ, ctrlJ]) => {
  if (cmdJ || ctrlJ) {
    handleOpenChange()
  }
})

const commands: CommandAction[] = [
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
      console.log('Open settings action')
      handleOpenChange()
    }
  },
  {
    id: 'toggle-theme',
    title: 'Toggle Theme',
    description: 'Switch between light and dark theme',
    keywords: ['theme', 'dark', 'light', 'appearance'],
    category: 'Application',
    action: () => {
      console.log('Toggle theme action')
      handleOpenChange()
    }
  }
]

// Group commands by category
const groupedCommands = commands.reduce(
  (groups, command) => {
    const category = command.category || 'General'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(command)
    return groups
  },
  {} as Record<string, CommandAction[]>
)

function handleOpenChange() {
  open.value = !open.value
  if (!open.value) {
    emit('close')
  }
}

function handleCommandSelect(event: any) {
  const commandId = event.detail?.value || event
  const command = commands.find((cmd) => cmd.id === commandId)
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
  <CommandDialog :open="open" @update:open="handleOpenChange">
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
                <span class="faseeh-command-palette__command-title">{{ command.title }}</span>
                <span
                  v-if="command.description"
                  class="faseeh-command-palette__command-description"
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
          />
        </template>
      </CommandList>
      <!-- Fixed footer with navigation shortcuts -->
      <div class="faseeh-command-palette__footer">
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
  </CommandDialog>
</template>
