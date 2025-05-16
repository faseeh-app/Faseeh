<script setup lang="ts">
import TitleBar from '@renderer/common/components/ui/TitleBar.vue'
import Sidebar from '@renderer/common/components/ui/Sidebar.vue'
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="flex h-screen">
    <Sidebar />
    <div class="flex flex-col flex-grow">
      <TitleBar />
      <main class="flex flex-col flex-grow">
        <router-view class="flex-grow" />
      </main>
      <!-- <div class=" flex flex-col w-72">
        </div> -->
    </div>
  </div>
</template>
