import type {
  PluginManifest,
  PluginInfo,
  FaseehApp,
  BasePlugin,
  PluginEvents,
  IPluginManager
} from '@shared/types/types'
import { BasePlugin as BasePluginClass } from './plugin'
import * as Runtime from '@shared/types/runtime'
import { EventBusService } from '@root/src/main/services/event-bus-service'

/**
 * Plugin Manager Service
 * Responsible for the complete lifecycle of community plugins
 */
export class PluginManager extends EventBusService<PluginEvents> implements IPluginManager {
  private app: FaseehApp
  private activePlugins = new Map<string, BasePlugin>()
  private discoveredManifests = new Map<string, PluginManifest>()
  private enabledPlugins = new Set<string>()
  private failedPlugins = new Map<string, string>() // pluginId -> error message
  private isInitialized = false

  constructor() {
    super('plugins')
    this.app = {} as FaseehApp
    /* FIXME: the whole app context passing needs to be refactored
     * The setApp method is just a temporary solution
     * what should be done is to create another context/service/utilty class that will be passed
     * to FaseehApp and then to the registry, that way we can avoid circular dependencies or at least that's the plan
     */
  }

  setApp(app: FaseehApp): void {
    this.app = app
  }

  /**
   * Initialize the plugin manager and load enabled plugins
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('Plugin Manager already initialized')
      return
    }

    try {
      console.log('🧩 Initializing Plugin Manager...')

      // Setup module resolution for plugins first
      this.setupModuleResolution()

      // Step 1-2: Read enabled plugins configuration
      await this.loadEnabledPluginsConfig()

      // Step 3-4: Discover and read plugin manifests
      await this.discoverPlugins()

      // Step 5-8: Load enabled plugins with dependency resolution
      await this.loadEnabledPlugins()

      this.isInitialized = true
      console.log('✅ Plugin Manager initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Plugin Manager:', error)
      throw error
    }
  }

  /**
   * Set up module resolution for plugins
   * This allows plugins to import '@faseeh-app/faseeh' and get the runtime exports
   */
  private setupModuleResolution(): void {
    // Set up module resolution for plugins
    // When plugins require('@faseeh-app/faseeh'), provide the actual runtime exports
    if (typeof window !== 'undefined' && typeof (window as any).require === 'function') {
      const Module = (window as any).require('module')
      const originalResolveFilename = Module._resolveFilename

      Module._resolveFilename = function (request: string, parent: any, isMain: boolean) {
        if (request === '@faseeh-app/faseeh') {
          // Return a dummy path that we'll handle in load
          return '@faseeh-app/faseeh-runtime'
        }
        return originalResolveFilename.call(this, request, parent, isMain)
      }

      const originalLoad = Module._load
      Module._load = function (request: string, parent: any, isMain: boolean) {
        if (request === '@faseeh-app/faseeh' || request === '@faseeh-app/faseeh-runtime') {
          // Return all plugin runtime exports from the barrel file
          return Runtime
        }
        return originalLoad.call(this, request, parent, isMain)
      }

      console.log('🔧 Module resolution setup complete for plugin loading')
    } else {
      console.warn('⚠️ Module resolution setup skipped - require not available')
    }
  }

  /**
   * Load enabled plugins configuration from storage
   */
  private async loadEnabledPluginsConfig(): Promise<void> {
    try {
      const enabledPluginIds = await this.app.storage.getEnabledPluginIds()
      this.enabledPlugins = new Set(enabledPluginIds)
      console.log(`📋 Loaded ${enabledPluginIds.length} enabled plugins from config`)
    } catch (error) {
      console.error('Failed to load enabled plugins config:', error)
      this.enabledPlugins = new Set()
    }
  }

  /**
   * Save enabled plugins configuration to storage
   */
  private async saveEnabledPluginsConfig(): Promise<void> {
    try {
      const enabledPluginIds = Array.from(this.enabledPlugins)
      await this.app.storage.setEnabledPluginIds(enabledPluginIds)
    } catch (error) {
      console.error('Failed to save enabled plugins config:', error)
    }
  }

  /**
   * Discover all installed plugins by scanning the plugins directory
   */
  private async discoverPlugins(): Promise<void> {
    try {
      const pluginDirs = await this.app.storage.listPluginDirectories()
      console.log(`🔍 Discovered ${pluginDirs.length} plugin directories`)

      this.discoveredManifests.clear()

      for (const pluginDir of pluginDirs) {
        try {
          const dirName = pluginDir.split('\\').pop() || pluginDir.split('/').pop() || pluginDir
          const manifest = await this.app.storage.readPluginManifest(dirName)
          // Validate required fields
          if (!this.validateManifest(manifest)) {
            console.warn(`⚠️ Invalid manifest for plugin: ${pluginDir}`)
            continue
          }
          // Check app version compatibility
          if (!this.isVersionCompatible(manifest.minAppVersion)) {
            console.warn(
              `⚠️ Plugin ${manifest.id} requires app version ${manifest.minAppVersion}, current: ${this.app.appInfo.version}`
            )
            continue
          }
          this.discoveredManifests.set(manifest.id, manifest)
          console.log(`✅ Discovered plugin: ${manifest.name} (${manifest.id})`)
        } catch (error) {
          console.warn(`⚠️ Failed to read manifest for plugin directory ${pluginDir}:`, error)
        }
      }
    } catch (error) {
      console.error('Failed to discover plugins:', error)
    }
  }

  /**
   * Validate plugin manifest
   */
  private validateManifest(manifest: any): manifest is PluginManifest {
    return (
      typeof manifest.id === 'string' &&
      typeof manifest.name === 'string' &&
      typeof manifest.version === 'string' &&
      typeof manifest.minAppVersion === 'string' &&
      typeof manifest.main === 'string' &&
      typeof manifest.description === 'string'
    )
  }

  /**
   * Check if plugin's minimum app version requirement is satisfied
   */
  private isVersionCompatible(minAppVersion: string): boolean {
    // Simple version comparison - you might want to use a proper semver library
    const currentParts = this.app.appInfo.version.split('.').map(Number)
    const requiredParts = minAppVersion.split('.').map(Number)

    for (let i = 0; i < Math.max(currentParts.length, requiredParts.length); i++) {
      const current = currentParts[i] || 0
      const required = requiredParts[i] || 0

      if (current > required) return true
      if (current < required) return false
    }

    return true // Equal versions
  }

  /**
   * Load all enabled plugins with proper dependency resolution
   */
  private async loadEnabledPlugins(): Promise<void> {
    // Build dependency graph
    const dependencyGraph = this.buildDependencyGraph()

    // Filter to only enabled plugins that are discovered and compatible
    const enabledValidPlugins = Array.from(this.enabledPlugins).filter((pluginId) =>
      this.discoveredManifests.has(pluginId)
    )

    // Check for circular dependencies
    if (this.hasCircularDependencies(dependencyGraph, enabledValidPlugins)) {
      console.error('❌ Circular dependencies detected in enabled plugins')
      return
    }

    // Determine load order using topological sort
    const loadOrder = this.topologicalSort(dependencyGraph, enabledValidPlugins)

    console.log(`📦 Loading ${loadOrder.length} plugins in dependency order:`, loadOrder)

    // Load plugins in order
    for (const pluginId of loadOrder) {
      await this.loadSinglePlugin(pluginId)
    }

    // Emit plugin list updated event
    this.emit('plugin:listUpdated', this.listPlugins())
  }

  /**
   * Build dependency graph from discovered manifests
   */
  private buildDependencyGraph(): Map<string, string[]> {
    const graph = new Map<string, string[]>()

    for (const [pluginId, manifest] of this.discoveredManifests) {
      graph.set(pluginId, manifest.pluginDependencies || [])
    }

    return graph
  }

  /**
   * Check for circular dependencies using DFS
   */
  private hasCircularDependencies(graph: Map<string, string[]>, plugins: string[]): boolean {
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    const hasCycle = (pluginId: string): boolean => {
      if (recursionStack.has(pluginId)) return true
      if (visited.has(pluginId)) return false

      visited.add(pluginId)
      recursionStack.add(pluginId)

      const dependencies = graph.get(pluginId) || []
      for (const dep of dependencies) {
        if (plugins.includes(dep) && hasCycle(dep)) {
          return true
        }
      }

      recursionStack.delete(pluginId)
      return false
    }

    for (const pluginId of plugins) {
      if (!visited.has(pluginId) && hasCycle(pluginId)) {
        return true
      }
    }

    return false
  }

  /**
   * Perform topological sort to determine load order
   */
  private topologicalSort(graph: Map<string, string[]>, plugins: string[]): string[] {
    const visited = new Set<string>()
    const result: string[] = []

    const visit = (pluginId: string): void => {
      if (visited.has(pluginId)) return

      visited.add(pluginId)

      const dependencies = graph.get(pluginId) || []
      for (const dep of dependencies) {
        if (plugins.includes(dep)) {
          visit(dep)
        }
      }

      result.push(pluginId)
    }

    for (const pluginId of plugins) {
      visit(pluginId)
    }

    return result
  }

  /**
   * Load a single plugin
   */
  private async loadSinglePlugin(pluginId: string): Promise<void> {
    try {
      const manifest = this.discoveredManifests.get(pluginId)
      if (!manifest) {
        throw new Error(`Manifest not found for plugin: ${pluginId}`)
      }

      // Check if dependencies are loaded
      const dependencies = manifest.pluginDependencies || []
      for (const depId of dependencies) {
        if (this.enabledPlugins.has(depId) && !this.activePlugins.has(depId)) {
          throw new Error(`Dependency ${depId} is not loaded`)
        }
      }

      console.log(`🔄 Loading plugin: ${manifest.name} (${pluginId})`) // Get plugin directories to find the main file
      const pluginDirs = await this.app.storage.listPluginDirectories()
      let pluginDir = pluginDirs.find((dir) => {
        // Extract just the directory name from absolute path
        const dirName = dir.split('\\').pop() || dir.split('/').pop() || dir
        return dirName === pluginId || dirName.endsWith(pluginId)
      })

      if (!pluginDir) {
        throw new Error(`Plugin directory not found for: ${pluginId}`)
      }

      // Extract just the directory name for the plugin path
      const pluginDirName = pluginDir.split('\\').pop() || pluginDir.split('/').pop() || pluginDir
      const pluginPath = `${pluginDirName}/${manifest.main}`
      // Load plugin module using require
      let PluginClass
      try {
        console.log(`🔄 Loading plugin: ${manifest.name} (${pluginId})`)

        // Use the storage service to get the plugin directory path
        const pluginDir = await this.app.storage.getPluginDirectoryPath(pluginId)

        if (!pluginDir) {
          throw new Error(`Could not find directory for plugin: ${pluginId}`)
        }

        // Construct plugin path using the correct directory
        const pluginPath = `${pluginDir}/${manifest.main}`

        // Load plugin module using require
        PluginClass = (window as any).require(pluginPath).default
      } catch (requireError) {
        console.error(`Failed to require plugin at path: ${pluginPath}`, requireError)
        throw new Error(`Failed to load plugin module: ${requireError}`)
      }

      // Create FaseehApp instance for the plugin
      const faseehApp: FaseehApp = this.createFaseehAppInstance()

      // Instantiate plugin
      const pluginInstance = new PluginClass(faseehApp, manifest) as BasePlugin

      // Validate plugin instance
      if (!(pluginInstance instanceof BasePluginClass)) {
        throw new Error(`Plugin ${pluginId} does not extend BasePlugin`)
      }

      // Store in registry before calling onload
      this.activePlugins.set(pluginId, pluginInstance)

      // Call plugin's onload method
      await pluginInstance.onload()

      // Clear any previous failure state
      this.failedPlugins.delete(pluginId)

      console.log(`✅ Plugin loaded successfully: ${manifest.name}`)
      this.emit('plugin:loaded', { pluginId })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`❌ Failed to load plugin ${pluginId}:`, errorMessage)

      // Remove from active plugins if it was added
      this.activePlugins.delete(pluginId)

      // Mark as failed
      this.failedPlugins.set(pluginId, errorMessage)

      // Disable plugins that depend on this failed plugin
      await this.disableDependentPlugins(pluginId)
    }
  }

  /**
   * Create FaseehApp instance for plugins
   */
  private createFaseehAppInstance(): FaseehApp {
    return this.app
  }

  /**
   * Disable plugins that depend on a failed plugin
   */
  private async disableDependentPlugins(failedPluginId: string): Promise<void> {
    const dependentPlugins: string[] = []

    for (const [pluginId, manifest] of this.discoveredManifests) {
      const dependencies = manifest.pluginDependencies || []
      if (dependencies.includes(failedPluginId) && this.enabledPlugins.has(pluginId)) {
        dependentPlugins.push(pluginId)
      }
    }

    for (const pluginId of dependentPlugins) {
      console.warn(`⚠️ Disabling plugin ${pluginId} due to failed dependency: ${failedPluginId}`)
      await this.disablePlugin(pluginId)
    }
  }

  /**
   * Get plugin instance by ID
   */
  getPluginInstance(pluginId: string): BasePlugin | null {
    return this.activePlugins.get(pluginId) || null
  }

  /**
   * Check if plugin is enabled
   */
  isPluginEnabled(pluginId: string): boolean {
    return this.enabledPlugins.has(pluginId)
  }

  /**
   * Enable a plugin
   */
  async enablePlugin(pluginId: string): Promise<void> {
    if (this.enabledPlugins.has(pluginId)) {
      console.log(`Plugin ${pluginId} is already enabled`)
      return
    }

    if (!this.discoveredManifests.has(pluginId)) {
      throw new Error(`Plugin ${pluginId} is not installed`)
    }

    // Add to enabled set
    this.enabledPlugins.add(pluginId)

    // Save configuration
    await this.saveEnabledPluginsConfig()

    // If plugin manager is initialized, try to load the plugin
    if (this.isInitialized) {
      await this.loadSinglePlugin(pluginId)
    }

    console.log(`✅ Plugin ${pluginId} enabled`)
    this.emit('plugin:listUpdated', this.listPlugins())
  }

  /**
   * Disable a plugin
   */
  async disablePlugin(pluginId: string): Promise<void> {
    if (!this.enabledPlugins.has(pluginId)) {
      console.log(`Plugin ${pluginId} is already disabled`)
      return
    }

    // Check for dependent plugins
    const dependentPlugins = this.getDependentPlugins(pluginId)
    if (dependentPlugins.length > 0) {
      console.warn(`⚠️ Plugin ${pluginId} has dependent plugins: ${dependentPlugins.join(', ')}`)
      // Optionally, you could throw an error here or disable dependents automatically
    }

    // Unload plugin if it's active
    const pluginInstance = this.activePlugins.get(pluginId)
    if (pluginInstance) {
      await this.unloadSinglePlugin(pluginId, pluginInstance)
    }

    // Remove from enabled set
    this.enabledPlugins.delete(pluginId)

    // Save configuration
    await this.saveEnabledPluginsConfig()

    console.log(`✅ Plugin ${pluginId} disabled`)
    this.emit('plugin:disabled', { pluginId })
    this.emit('plugin:listUpdated', this.listPlugins())
  }

  /**
   * Get plugins that depend on the specified plugin
   */
  private getDependentPlugins(pluginId: string): string[] {
    const dependents: string[] = []

    for (const [id, manifest] of this.discoveredManifests) {
      const dependencies = manifest.pluginDependencies || []
      if (dependencies.includes(pluginId) && this.enabledPlugins.has(id)) {
        dependents.push(id)
      }
    }

    return dependents
  }

  /**
   * Unload a single plugin
   */
  private async unloadSinglePlugin(pluginId: string, pluginInstance: BasePlugin): Promise<void> {
    try {
      console.log(`🔄 Unloading plugin: ${pluginId}`)

      // Call plugin's onunload method
      await pluginInstance.onunload()

      // Clean up listeners
      pluginInstance._cleanupListeners()

      // Remove from active plugins
      this.activePlugins.delete(pluginId)

      console.log(`✅ Plugin unloaded successfully: ${pluginId}`)
      this.emit('plugin:unloaded', { pluginId })
    } catch (error) {
      console.error(`❌ Error unloading plugin ${pluginId}:`, error)
      // Still remove from active plugins to prevent memory leaks
      this.activePlugins.delete(pluginId)
    }
  }

  /**
   * List all plugins with their status
   */
  listPlugins(): PluginInfo[] {
    const plugins: PluginInfo[] = []

    for (const [pluginId, manifest] of this.discoveredManifests) {
      const isEnabled = this.enabledPlugins.has(pluginId)
      const isLoaded = this.activePlugins.has(pluginId)
      const hasFailed = this.failedPlugins.has(pluginId)
      const error = this.failedPlugins.get(pluginId)

      plugins.push({
        manifest,
        isEnabled,
        isLoaded,
        hasFailed,
        error
      })
    }

    return plugins
  }

  /**
   * Shutdown plugin manager and unload all plugins
   */
  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down Plugin Manager...')

    // Get all active plugin instances
    const activePluginEntries = Array.from(this.activePlugins.entries())

    // Unload plugins (potentially in reverse dependency order)
    for (const [pluginId, pluginInstance] of activePluginEntries) {
      await this.unloadSinglePlugin(pluginId, pluginInstance)
    }

    // Clear all internal state
    this.activePlugins.clear()
    this.failedPlugins.clear()
    this.isInitialized = false

    console.log('✅ Plugin Manager shutdown complete')
  }

  /**
   * Refresh plugin discovery (useful for development)
   */
  async refreshPlugins(): Promise<void> {
    console.log('🔄 Refreshing plugin discovery...')
    await this.discoverPlugins()
    this.emit('plugin:listUpdated', this.listPlugins())
  }
}
