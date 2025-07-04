import '@renderer/common/assets/styles/main.css'
import { createApp, App as VueApp, nextTick } from 'vue'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter, Router } from 'vue-router'
import App from './App.vue'
import { routes } from '@renderer/core/router/routes'
import {
  storage,
  pluginManager,
  themeService,
  keyboardShortcutService,
  initializeServices,
  shutdownServices
} from '@renderer/core/services/service-container'

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

    // Set up shutdown event listeners
    window.addEventListener('beforeunload', () => this.close())

    // Additional Electron-specific shutdown handling
    window.addEventListener('unload', () => this.close())

    // Handle page visibility changes (optional cleanup on hide)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // Could add partial cleanup here if needed
      }
    })
  }
  async run(): Promise<void> {
    if (!this.app) {
      throw new Error('Application not initialized. Call init() first.')
    }

    // Initialize theme service (this will apply the saved theme or default theme)
    // Theme service is initialized on import, but we reference it here to ensure it's loaded
    console.log('Theme service initialized with theme:', themeService.currentTheme.value)

    // Initialize all services first (includes plugin manager)
    await initializeServices()

    // Get the plugin manager instance
    const pluginMgr = pluginManager()
    console.log(pluginMgr.listPlugins())

    this.app.mount('#app')

    // Finalize shortcut loading after all components are mounted
    await nextTick()
    console.log('Finalizing shortcuts after component mount...')
    await keyboardShortcutService.finalizeShortcutLoading()
  }
  test(): void {
    if (import.meta.env.DEV) {
      const storageService = storage()
      storageService.on('media:saved', (event) => {
        console.log('Renderer received event - Media saved:', event.mediaId, 'from', event.path)
      })

      storageService.emit('media:saved', { mediaId: '67890', path: 'local' })

      // Test storage API
      this.testStorage()
    }
  }
  async close(): Promise<void> {
    // Shutdown all services properly (includes storage cleanup)
    await shutdownServices()
  }
  private async testStorage(): Promise<void> {
    try {
      const storageService = storage()
      console.log(await storageService.listPluginDirectories())

      await storageService.setAppSetting({
        key: 'testKey',
        value: JSON.stringify({ test: 'value' })
      })

      // const setting = await storageService.getAppSetting('testKey')
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
