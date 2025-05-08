<script setup lang="ts">
import TitleBar from '@/components/ui/TitleBar.vue'
import Sidebar from '@/components/ui/Sidebar.vue'
</script>

<template>
  <div class="flex flex-col h-screen">
    <TitleBar />
    <div class="flex h-full">
      <Sidebar />
      <main class="flex"></main>
      <div class="faseeh-sidebar--right"></div>
    </div>
  </div>
</template>
