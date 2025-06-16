<script setup lang="ts">
import TitleBar from '@renderer/common/components/TitleBar.vue'
import Sidebar from '@renderer/common/components/Sidebar.vue'
import ResizablePanel from '@renderer/common/components/ui/ResizablePanel.vue'
import { useTabStore } from '@renderer/core/stores/useTabStore'

const tabStore = useTabStore()
</script>

<template>
  <div class="flex h-screen">
    <Sidebar />
    <div class="flex flex-col w-full min-w-0">
      <TitleBar />
      <main class="flex flex-grow">
        <router-view v-slot="{ Component }">
          <KeepAlive>
            <component
              :is="Component"
              :key="`${String($route.name)}-${tabStore.activeTabId}`"
              class="flex-1 min-w-0"
            />
          </KeepAlive>
        </router-view>
        <KeepAlive>
          <ResizablePanel
            :key="`panel-${tabStore.activeTabId}-${String($route.name)}-${JSON.stringify($route.params)}`"
          />
        </KeepAlive>
      </main>
    </div>
  </div>
</template>
