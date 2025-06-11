import '@renderer/common/assets/styles/main.css'
import { createApp, App as VueApp } from 'vue'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter, Router } from 'vue-router'
import { storage } from '@root/src/renderer/src/core/services/storage/storage-service'
import { PluginManager } from './core/services/plugins/plugin-manager'
import { EventBusService } from './core/services/event-bus/event-bus-service'
import type { PluginEvents } from '@shared/types'

import App from './App.vue'
import { routes } from '@renderer/common/router/routes'

class RendererLifecycle {
  private app: VueApp | null = null
  private router: Router | null = null
  private pluginManager: PluginManager | null = null

  init(): void {
    const pinia = createPinia()

    this.router = createRouter({
      history: createMemoryHistory(),
      routes
    })

    this.app = createApp(App)
    this.app.use(pinia)
    this.app.use(this.router) // Initialize Plugin Manager
    const eventBus = new EventBusService<PluginEvents>('plugins')
    this.pluginManager = new PluginManager(storage, eventBus, '1.0.0') // TODO: Get actual app version

    window.addEventListener('beforeunload', () => this.close())
  }
  async run(): Promise<void> {
    if (!this.app) {
      throw new Error('Application not initialized. Call init() first.')
    }

    // Initialize plugin manager first
    if (this.pluginManager) {
      await this.pluginManager.initialize()
      console.log(this.pluginManager.listPlugins())
    }

    this.app.mount('#app')
  }
  test(): void {
    if (import.meta.env.DEV) {
      storage.on('media:saved', (event) => {
        console.log('Renderer received event - Media saved:', event.mediaId, 'from', event.path)
      })

      storage.emit('media:saved', { mediaId: '67890', path: 'local' })

      // Test storage API
      this.testStorage()
    }
  }
  async close(): Promise<void> {
    // Shutdown plugin manager first
    if (this.pluginManager) {
      await this.pluginManager.shutdown()
    }

    storage.clearAllHandlers()
  }
  private async testStorage(): Promise<void> {
    try {
      console.log(await storage.listPluginDirectories())

      await storage.setAppSetting({
        key: 'testKey',
        value: JSON.stringify({ test: 'value' })
      })

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
renderer
  .run()
  .then(() => {
    renderer.test()
  })
  .catch((error) => {
    console.error('Failed to start renderer:', error)
  })
