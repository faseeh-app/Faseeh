<script setup lang="ts">
import { IconCloseFill } from '@iconify-prerendered/vue-eva'
import { IconMinimize12Filled } from '@iconify-prerendered/vue-fluent'
import { IconSquareMultiple16Regular } from '@iconify-prerendered/vue-fluent'

function minimizeWindow(): void {
  window.electron.ipcRenderer.send('window:minimize')
}

function maximizeWindow(): void {
  window.electron.ipcRenderer.send('window:maximize')
}

function closeWindow(): void {
  window.electron.ipcRenderer.send('window:close')
}
</script>

<template>
  <div class="faseeh-titlebar">
    <img src="@/assets/Faseeh_H_Dark.svg" class="faseeh-titlebar__logo" />
    <div class="faseeh-titlebar__window-controls">
      <div class="faseeh-titlebar__window-controls__button" @click="minimizeWindow">
        <IconMinimize12Filled />
      </div>
      <div class="faseeh-titlebar__window-controls__button" @click="maximizeWindow">
        <IconSquareMultiple16Regular />
      </div>
      <div class="faseeh-titlebar__window-controls__button--close" @click="closeWindow">
        <IconCloseFill />
      </div>
    </div>
  </div>
</template>
