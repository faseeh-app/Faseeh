import '@renderer/common/assets/styles/main.css'
import { createApp, App as VueApp } from 'vue'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter, Router } from 'vue-router'
import { storage } from '@root/src/renderer/src/core/services/storage-service'

import App from './App.vue'
import { routes } from '@renderer/common/router/routes'
import { workspaceEvents } from '@shared/constants/event-emitters'

class RendererLifecycle {
  private app: VueApp | null = null
  private router: Router | null = null

  init(): void {
    const pinia = createPinia()

    this.router = createRouter({
      history: createMemoryHistory(),
      routes
    })

    this.app = createApp(App)
    this.app.use(pinia)
    this.app.use(this.router)
    workspaceEvents.on('media:opened', (event) => {
      console.log('Renderer received event - Media opened:', event.mediaId, 'from', event.source)
    })

    window.addEventListener('beforeunload', () => this.close())
  }

  run(): void {
    if (!this.app) {
      throw new Error('Application not initialized. Call init() first.')
    }
    this.app.mount('#app')
  }
  test(): void {
    if (import.meta.env.DEV) {
      // Test event system
      console.log('Renderer emitting test event...')
      workspaceEvents.emit('media:opened', { mediaId: '67890', source: 'local' })

      // Test storage API
      this.testStorage()
    }
  }

  close(): void {
    workspaceEvents.clearAllHandlers()
  }

  private async testStorage(): Promise<void> {
    try {
      console.log(await storage.listPluginDirectories())

      // await storage.setAppSetting({
      //   key: 'testKey',
      //   value: JSON.stringify([1, 2, 3, 4, 5])
      // })

      // const setting = await storage.getAppSetting('testKey')
      // if (setting) {
      //   console.log('Value from storage:', JSON.parse(setting.value))
      // } else {
      //   console.log('Setting "testKey" not found.')
      // }
    } catch (error) {
      console.error('Storage service test failed:', error)
    }
  }
}

const renderer = new RendererLifecycle()
renderer.init()
renderer.run()
renderer.test()
