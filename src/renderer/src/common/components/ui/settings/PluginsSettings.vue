<script setup lang="ts">
import { AlertTriangle, CheckCircle, Loader2, Package } from 'lucide-vue-next'
import { Button } from '@renderer/common/components/ui/button'
import type { PluginInfo } from '@shared/types/types'

interface Props {
  plugins: PluginInfo[]
  loadingPlugins: string[]
}

interface Emits {
  togglePlugin: [plugin: PluginInfo]
}

defineProps<Props>()
defineEmits<Emits>()

function getPluginStatusBadge(plugin: PluginInfo): {
  text: string
  classes: string
} {
  if (plugin.hasFailed) {
    return {
      text: 'Error',
      classes: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }
  }
  if (!plugin.isEnabled) {
    return {
      text: 'Disabled',
      classes: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }
  if (plugin.isLoaded) {
    return {
      text: 'Active',
      classes: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    }
  }
  return {
    text: 'Enabled',
    classes:
      'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700'
  }
}
</script>

<template>
  <div class="space-y-8">
    <div class="space-y-8">
      <div>
        <h3 class="text-xl font-semibold">Plugin Management</h3>
        <p class="text-sm text-muted-foreground mt-2">
          Manage community plugins to extend Faseeh's functionality with custom content adapters,
          metadata scrapers, and other features.
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
          class="flex flex-col sm:flex-row sm:items-center justify-between p-6 border border-input rounded-lg hover:bg-muted/50 transition-colors gap-4"
        >
          <div class="flex-1 min-w-0">
            <div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
              <h4 class="font-medium text-lg">{{ plugin.manifest.name }}</h4>
              <span
                :class="[
                  'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shrink-0 w-fit',
                  getPluginStatusBadge(plugin).classes
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
              @click="$emit('togglePlugin', plugin)"
              class="w-20"
            >
              {{ plugin.isEnabled ? 'Disable' : 'Enable' }}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
