<script setup lang="ts">
import TitleBar from '@renderer/common/components/ui/TitleBar.vue'
import Sidebar from '@renderer/common/components/ui/Sidebar.vue'
import { useTabStore } from '@renderer/common/stores/useTabStore'

const tabStore = useTabStore()
</script>

<template>
  <div class="flex h-screen">
    <Sidebar />
    <div class="flex flex-col w-full min-w-0">
      <TitleBar />
      <main class="flex flex-col flex-grow">
        <router-view v-slot="{ Component }">
          <KeepAlive>
            <component
              :is="Component"
              :key="`${String($route.name)}-${tabStore.activeTabId}`"
              class="flex-grow"
            />
          </KeepAlive>
        </router-view>
      </main>
    </div>
  </div>
</template>
