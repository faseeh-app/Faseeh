<script setup lang="ts">
// Application settings component
</script>

<template>
  <div class="space-y-8">
    <div class="space-y-8">
      <div>
        <h3 class="text-xl font-semibold mb-6">General</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <label for="language-select" class="block text-sm font-medium">Language</label>
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
            <label for="startup-option" class="text-sm font-medium"> Start with system </label>
          </div>
          <div class="flex items-center space-x-3">
            <input
              id="minimize-tray"
              type="checkbox"
              class="rounded border-input w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
            />
            <label for="minimize-tray" class="text-sm font-medium"> Minimize to system tray </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
