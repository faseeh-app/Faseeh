<script setup lang="ts">
import { computed } from 'vue'
import { Sun, Moon, Monitor } from 'lucide-vue-next'
import { themeService } from '@renderer/core/services/service-container'
import type { Theme } from '@renderer/core/services/theme/theme.service'

const currentTheme = computed(() => themeService.currentTheme.value)
const effectiveTheme = computed(() => themeService.effectiveTheme.value)

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
</script>

<template>
  <div class="space-y-8">
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
</template>
