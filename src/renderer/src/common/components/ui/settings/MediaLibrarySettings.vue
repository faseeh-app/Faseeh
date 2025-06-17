<script setup lang="ts">
// Media Library settings component
</script>

<template>
  <div class="space-y-8">
    <div class="space-y-8">
      <div>
        <h3 class="text-xl font-semibold mb-6">Library Management</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <label for="view-select" class="block text-sm font-medium">Default view</label>
            <select
              id="view-select"
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option>Grid view</option>
              <option>List view</option>
              <option>Card view</option>
            </select>
          </div>
          <div class="space-y-2">
            <label for="items-per-page" class="block text-sm font-medium">Items per page</label>
            <select
              id="items-per-page"
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option>25</option>
              <option>50</option>
              <option>100</option>
              <option>200</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div class="flex items-center space-x-3">
            <input
              id="auto-organize"
              type="checkbox"
              class="rounded border-input w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
            />
            <label for="auto-organize" class="text-sm font-medium">
              Auto-organize imported files
            </label>
          </div>
          <div class="flex items-center space-x-3">
            <input
              id="auto-metadata"
              type="checkbox"
              class="rounded border-input w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
            />
            <label for="auto-metadata" class="text-sm font-medium"> Auto-extract metadata </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
