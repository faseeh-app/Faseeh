import type { IPlugin, FaseehApp, PluginManifest, PluginUIViewConfig } from '@shared/types/types'
/**
 * Plugin abstract class that all plugins must implement
 * @public
 */
export abstract class BasePlugin implements IPlugin {
  public readonly app: FaseehApp
  public readonly manifest: PluginManifest
  private listenerCleaners: Array<() => void> = []

  constructor(app: FaseehApp, manifest: PluginManifest) {
    this.app = app
    this.manifest = manifest
  }

  public abstract onload(): Promise<void>
  public abstract onunload(): void | Promise<void>

  public registerEvent(disposer: () => void): void {
    this.listenerCleaners.push(disposer)
  }

  // --- Database Storage Methods ---

  // Note: Let's consider these two methods are meant for general plugin data, most used ones.
  public async loadData(): Promise<any> {
    return this.loadDataWithContext(null)
  }

  public async saveData(data: any): Promise<void> {
    return this.saveDataWithContext(data, null)
  }

  // Note: while these are for data scoped to a specific library item, that might save some query time
  public async loadDataWithContext(libraryItemId: string | null): Promise<any> {
    try {
      const pluginData = await this.app.storage.getPluginDataEntries(
        this.manifest.id,
        'data.json',
        libraryItemId
      )
      if (pluginData && pluginData.length > 0) {
        return JSON.parse(pluginData[0].jsonData)
      }
      return {}
    } catch (error) {
      console.error(`Failed to load data for plugin ${this.manifest.id}:`, error)
      return {}
    }
  }

  public async saveDataWithContext(data: any, libraryItemId: string | null): Promise<void> {
    try {
      const existingData = await this.app.storage.getPluginDataEntries(
        this.manifest.id,
        'data.json',
        libraryItemId
      )

      const jsonValue = JSON.stringify(data)

      if (existingData && existingData.length > 0) {
        await this.app.storage.updatePluginDataEntry(existingData[0].id, {
          jsonData: jsonValue
        })
      } else {
        await this.app.storage.createPluginDataEntry({
          pluginId: this.manifest.id,
          key: 'data.json',
          jsonData: jsonValue,
          libraryItemId: libraryItemId ?? undefined
        })
      }
    } catch (error) {
      console.error(`Failed to save data for plugin ${this.manifest.id}:`, error)
    }
  }

  // --- File Storage Methods ---

  // Note: And just in case plugin developer want to use file storage for plugin data, here are the methods
  public async readDataFile(relativePath: string): Promise<string | undefined> {
    try {
      return await this.app.storage.readPluginDataFile(this.manifest.id, relativePath)
    } catch (error) {
      console.error(`Failed to read plugin data file ${relativePath}:`, error)
      return undefined
    }
  }

  public async writeDataFile(relativePath: string, content: string): Promise<boolean> {
    try {
      return await this.app.storage.writePluginDataFile(this.manifest.id, relativePath, content)
    } catch (error) {
      console.error(`Failed to write plugin data file ${relativePath}:`, error)
      return false
    }
  }

  public async deleteDataFile(relativePath: string): Promise<boolean> {
    try {
      return await this.app.storage.deletePluginDataFile(this.manifest.id, relativePath)
    } catch (error) {
      console.error(`Failed to delete plugin data file ${relativePath}:`, error)
      return false
    }
  }
  public async listDataFiles(subDirectory?: string): Promise<string[]> {
    try {
      return await this.app.storage.listPluginDataFiles(this.manifest.id, subDirectory)
    } catch (error) {
      console.error(`Failed to list plugin data files:`, error)
      return []
    }
  }

  // --- Plugin UI Methods ---

  public registerView(config: PluginUIViewConfig): string {
    if (!this.app.ui) {
      throw new Error('Plugin UI system not available')
    }

    const viewKey = this.app.ui.registerView(this.manifest.id, config)

    // Register cleanup
    this.registerEvent(() => {
      this.app.ui?.unregisterView(this.manifest.id, config.id)
    })

    return viewKey
  }

  public openView(pluginId: string, viewId: string): boolean {
    if (!this.app.ui) {
      console.warn('Plugin UI system not available')
      return false
    }

    return this.app.ui.activateViewById(pluginId, viewId)
  }

  public closeView(pluginId: string, viewId: string): boolean {
    if (!this.app.ui) {
      console.warn('Plugin UI system not available')
      return false
    }

    // For now, we can only deactivate the current view
    const activeView = this.app.ui.getActiveView()
    if (activeView && activeView.pluginId === pluginId && activeView.id === viewId) {
      return this.app.ui.deactivateCurrentView()
    }

    return false
  }

  public activateView(pluginId: string, viewId: string): boolean {
    if (!this.app.ui) {
      console.warn('Plugin UI system not available')
      return false
    }

    return this.app.ui.activateViewById(pluginId, viewId)
  }

  public _cleanupListeners(): void {
    for (const clean of this.listenerCleaners) {
      clean()
    }
    this.listenerCleaners = []
  }
}
