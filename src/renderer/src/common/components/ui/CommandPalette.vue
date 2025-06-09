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
  CommandSeparator,
  CommandShortcut
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
    <div class="flex flex-col h-full max-h-[600px]">
      <CommandInput :placeholder="placeholder" />
      <CommandList class="flex-1 overflow-y-auto">
        <CommandEmpty>No commands found.</CommandEmpty>        <template v-for="(categoryCommands, category) in groupedCommands" :key="category">
          <CommandGroup :heading="category">
            <CommandItem
              v-for="command in categoryCommands"
              :key="command.id"
              :value="command.id"
              @select="handleCommandSelect"
            >
              <div class="flex flex-col">
                <span class="font-medium">{{ command.title }}</span>
                <span v-if="command.description" class="text-base text-muted-foreground">
                  {{ command.description }}
                </span>
              </div>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator
            v-if="
              Object.keys(groupedCommands).indexOf(category) < Object.keys(groupedCommands).length - 1
            "
          />        </template>
      </CommandList>
      
      <!-- Fixed footer with navigation shortcuts -->
      <div class="border-t border-border bg-muted/30 px-6 py-6 flex-shrink-0">
        <div class="flex items-center justify-between text-sm text-muted-foreground">
          <div class="flex items-center gap-6">
            <div class="flex items-center gap-2">
              <kbd class="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-xs font-medium text-muted-foreground opacity-100">
                ↑↓
              </kbd>
              <span>navigate</span>
            </div>
            <div class="flex items-center gap-2">
              <kbd class="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-xs font-medium text-muted-foreground opacity-100">
                ↵
              </kbd>
              <span>select</span>
            </div>
            <div class="flex items-center gap-2">
              <kbd class="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-xs font-medium text-muted-foreground opacity-100">
                esc
              </kbd>
              <span>close</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <kbd class="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-xs font-medium text-muted-foreground opacity-100">
              ⌘J
            </kbd>
            <span>toggle</span>
          </div>
        </div>
      </div>
    </div>
  </CommandDialog>
</template>
