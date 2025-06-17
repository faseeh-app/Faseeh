<script setup lang="ts">
import { AlertTriangle, CheckCircle, Package } from 'lucide-vue-next'
import { Button } from '@renderer/common/components/ui/button'
import { keyboardShortcutService } from '@renderer/core/services/service-container'
import type { KeyboardShortcut } from '@renderer/core/services/keyboard/keyboard-shortcut-service'

interface Props {
  searchQuery: string
  editingShortcut: string | null
  newKeysInput: string
  filteredShortcuts: KeyboardShortcut[]
  shortcutsByCategory: Record<string, KeyboardShortcut[]>
}

interface Emits {
  'update:searchQuery': [value: string]
  'update:newKeysInput': [value: string]
  startEditingShortcut: [shortcutId: string]
  cancelEditingShortcut: []
  saveShortcutKeys: [shortcutId: string]
  toggleShortcut: [shortcutId: string]
  resetShortcutToDefault: [shortcutId: string]
}

defineProps<Props>()
defineEmits<Emits>()

function getShortcutConflicts(shortcut: KeyboardShortcut): string[] {
  const conflicts = keyboardShortcutService.findConflicts(shortcut)
  return conflicts.map((conflict) =>
    conflict.shortcut1.id === shortcut.id ? conflict.shortcut2.name : conflict.shortcut1.name
  )
}
</script>

<template>
  <div class="h-full flex flex-col">
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
        <label for="shortcut-search" class="block text-sm font-medium mb-2">
          Search shortcuts
        </label>
        <input
          id="shortcut-search"
          :value="searchQuery"
          type="text"
          placeholder="Search by name, description, or key combination..."
          class="w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
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
          <h4 class="font-medium text-sm mb-2 text-muted-foreground uppercase tracking-wide">
            {{ category }}
          </h4>
          <div class="space-y-1.5">
            <div
              v-for="shortcut in categoryShortcuts"
              :key="shortcut.id"
              :class="[
                'flex flex-col lg:flex-row lg:items-center justify-between p-2.5 rounded-md border border-input transition-colors gap-2',
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
                      <kbd class="px-1.5 py-0.5 text-xs font-mono bg-muted rounded border">
                        {{ keyboardShortcutService.formatKeyCombo(key) }}
                      </kbd>
                      <span
                        v-if="index < shortcut.keys.length - 1"
                        class="text-muted-foreground text-xs"
                      >
                        or
                      </span>
                    </span>
                  </div>

                  <!-- Edit mode -->
                  <div v-if="editingShortcut === shortcut.id" class="flex items-center gap-1.5">
                    <input
                      :value="newKeysInput"
                      type="text"
                      placeholder="ctrl+shift+t, ctrl+t"
                      class="px-2 py-1 text-xs border border-input rounded focus:outline-none focus:ring-1 focus:ring-primary min-w-40"
                      @input="
                        $emit('update:newKeysInput', ($event.target as HTMLInputElement).value)
                      "
                      @keydown.enter="$emit('saveShortcutKeys', shortcut.id)"
                      @keydown.escape="$emit('cancelEditingShortcut')"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      @click="$emit('saveShortcutKeys', shortcut.id)"
                      class="h-6 w-6 p-0"
                    >
                      <CheckCircle class="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      @click="$emit('cancelEditingShortcut')"
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
                  @click="$emit('startEditingShortcut', shortcut.id)"
                  class="h-7 px-2 text-xs"
                >
                  Edit
                </Button>

                <!-- Enable/Disable toggle -->
                <Button
                  :variant="shortcut.enabled ? 'default' : 'outline'"
                  size="sm"
                  @click="$emit('toggleShortcut', shortcut.id)"
                  class="h-7 px-2 text-xs w-14"
                >
                  {{ shortcut.enabled ? 'Disable' : 'Enable' }}
                </Button>

                <!-- Reset button -->
                <Button
                  variant="ghost"
                  size="sm"
                  @click="$emit('resetShortcutToDefault', shortcut.id)"
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
