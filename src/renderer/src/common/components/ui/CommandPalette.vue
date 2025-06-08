<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { Input } from '@renderer/common/components/ui/input'
import ScrollArea from '@renderer/common/components/ui/scroll-area/ScrollArea.vue'

interface CommandItem {
  id: string
  title: string
  description?: string
  icon?: string
  keywords?: string[]
  category?: string
  action: () => void
}

interface Props {
  isOpen: boolean
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search for commands and media...'
})

const emit = defineEmits<{
  close: []
}>()

const searchQuery = ref('')
const selectedIndex = ref(0)
const inputRef = ref<HTMLInputElement>()

const commands = ref<CommandItem[]>([
  {
    id: 'search-media',
    title: 'Search Media',
    description: 'Search through your media library',
    icon: 'icon-[solar--magnifer-linear]',
    keywords: ['search', 'find', 'media', 'library'],
    category: 'Media',
    action: () => {
      console.log('Search media action')
      emit('close')
    }
  },
  {
    id: 'import-media',
    title: 'Import Media',
    description: 'Import new media files',
    icon: 'icon-[solar--import-bold]',
    keywords: ['import', 'add', 'upload', 'file'],
    category: 'Media',
    action: () => {
      console.log('Import media action')
      emit('close')
    }
  },
  {
    id: 'create-collection',
    title: 'Create Collection',
    description: 'Create a new media collection',
    icon: 'icon-[solar--folder-plus-bold]',
    keywords: ['create', 'collection', 'folder', 'organize'],
    category: 'Organization',
    action: () => {
      console.log('Create collection action')
      emit('close')
    }
  },
  {
    id: 'open-settings',
    title: 'Open Settings',
    description: 'Configure application settings',
    icon: 'icon-[solar--settings-bold]',
    keywords: ['settings', 'preferences', 'configure', 'options'],
    category: 'Application',
    action: () => {
      console.log('Open settings action')
      emit('close')
    }
  },
  {
    id: 'toggle-theme',
    title: 'Toggle Theme',
    description: 'Switch between light and dark theme',
    icon: 'icon-[solar--palette-bold]',
    keywords: ['theme', 'dark', 'light', 'appearance'],
    category: 'Application',
    action: () => {
      console.log('Toggle theme action')
      emit('close')
    }
  }
])

const filteredCommands = computed(() => {
  if (!searchQuery.value.trim()) return commands.value

  const query = searchQuery.value.toLowerCase().trim()
  return commands.value.filter(command => {
    const searchText = [
      command.title,
      command.description,
      ...(command.keywords || [])
    ].join(' ').toLowerCase()
    
    return searchText.includes(query)
  })
})

const groupedCommands = computed(() => {
  const groups: Record<string, CommandItem[]> = {}
  
  filteredCommands.value.forEach(command => {
    const category = command.category || 'General'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(command)
  })
  
  return groups
})

// Keyboard navigation
const handleKeyDown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Escape':
      event.preventDefault()
      emit('close')
      break
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, filteredCommands.value.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
      break
    case 'Enter':
      event.preventDefault()
      if (filteredCommands.value[selectedIndex.value]) {
        filteredCommands.value[selectedIndex.value].action()
      }
      break
  }
}

const handleCommandClick = (command: CommandItem) => {
  command.action()
}

// Focus management
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    await nextTick()
    inputRef.value?.focus()
    selectedIndex.value = 0
    searchQuery.value = ''
  }
})

// Reset selected index when search changes
watch(searchQuery, () => {
  selectedIndex.value = 0
})

// Handle click outside to close
const handleOverlayClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20"
      @click="handleOverlayClick"
    >
      <div
        class="bg-popover border border-border rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[60vh] flex flex-col"
        @click.stop
      >
        <!-- Search Input -->
        <div class="p-4 border-b border-border">
          <div class="relative">
            <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              <span class="icon-[iconamoon--search-bold] size-4" />
            </span>
            <Input
              ref="inputRef"
              v-model="searchQuery"
              :placeholder="placeholder"
              class="pl-10 border-none bg-transparent focus-visible:ring-0 focus-visible:border-transparent"
            />
          </div>
        </div>

        <!-- Results -->
        <ScrollArea class="flex-1">
          <div class="p-2 max-h-96">
            <div v-if="filteredCommands.length === 0" class="p-8 text-center text-muted-foreground">
              <span class="icon-[solar--ghost-bold] size-8 mx-auto mb-2 block" />
              <p>No commands found</p>
              <p class="text-sm">Try searching for something else</p>
            </div>

            <div v-else>
              <div
                v-for="(categoryCommands, category) in groupedCommands"
                :key="category"
                class="mb-4 last:mb-0"
              >
                <div class="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {{ category }}
                </div>
                
                <div
                  v-for="(command, commandIndex) in categoryCommands"
                  :key="command.id"
                  class="relative"
                >
                  <button
                    :class="[
                      'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      selectedIndex === filteredCommands.indexOf(command) 
                        ? 'bg-accent text-accent-foreground' 
                        : 'text-foreground'
                    ]"
                    @click="handleCommandClick(command)"
                    @mouseover="selectedIndex = filteredCommands.indexOf(command)"
                  >
                    <span
                      v-if="command.icon"
                      :class="[command.icon, 'size-4 shrink-0 text-muted-foreground']"
                    />
                    <div class="flex-1 min-w-0">
                      <div class="font-medium truncate">{{ command.title }}</div>
                      <div
                        v-if="command.description"
                        class="text-sm text-muted-foreground truncate"
                      >
                        {{ command.description }}
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <!-- Footer -->
        <div class="px-4 py-3 border-t border-border bg-muted/50 rounded-b-lg">
          <div class="flex items-center justify-between text-xs text-muted-foreground">
            <div class="flex items-center gap-4">
              <span class="flex items-center gap-1">
                <kbd class="px-1.5 py-0.5 bg-muted border border-border rounded text-xs">↑↓</kbd>
                Navigate
              </span>
              <span class="flex items-center gap-1">
                <kbd class="px-1.5 py-0.5 bg-muted border border-border rounded text-xs">Enter</kbd>
                Select
              </span>
              <span class="flex items-center gap-1">
                <kbd class="px-1.5 py-0.5 bg-muted border border-border rounded text-xs">Esc</kbd>
                Close
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
