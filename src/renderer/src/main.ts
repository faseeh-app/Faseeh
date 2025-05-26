import '@renderer/common/assets/styles/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { routes } from '@renderer/common/router/routes'
import { workspaceEvents } from '@shared/constants/event-emitters'

const pinia = createPinia()
export const router = createRouter({
  history: createMemoryHistory(),
  routes
})
const app = createApp(App)

app.use(pinia)
app.use(router)
app.mount('#app')

workspaceEvents.setupRendererListeners()
workspaceEvents.on('media:opened', (event) => {
  console.log('Renderer:Media opened:', event.mediaId, 'from', event.source)
})
workspaceEvents.emit('media:opened', { mediaId: '12345', source: 'local' })

async function testStorageService() {
  await window.storageAPI.setAppSetting({ key: 'testKey', value: JSON.stringify([1, 2, 3, 4, 5]) })
  const setting = await window.storageAPI.getAppSetting('testKey')
  if (setting) {
    console.log('Value from storage:', JSON.parse(setting.value))
  } else {
    console.log('Setting "testKey" not found.')
  }
}

testStorageService()
