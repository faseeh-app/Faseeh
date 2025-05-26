import { app, shell, BrowserWindow } from 'electron'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { join } from 'path'
import icon from '@root/resources/icon.png?asset'
import { db, migrateToLatest } from '@main/db/database'
import { initializeFaseehDirectory, setupStorageServiceIPC } from '@main/services/storage-service'
import { setupWindowControls } from '@main/utilities/window-controls'
import { vaultEvents } from '@shared/constants/event-emitters'

class AppLifecycle {
  private mainWindow: BrowserWindow | null = null

  async init(): Promise<void> {
    // Initialize database
    await migrateToLatest(db)

    // Initialize & setup main process services
    await initializeFaseehDirectory()
    setupStorageServiceIPC(db)

    // Configure app behavior
    electronApp.setAppUserModelId('com.faseeh')

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.run()
      }
    })

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })

    app.on('before-quit', () => {
      this.close()
    })
  }

  run(): void {
    this.mainWindow = new BrowserWindow({
      width: 900,
      height: 670,
      show: false,
      icon: icon,
      autoHideMenuBar: true,
      frame: false,
      ...(process.platform === 'linux' ? { icon } : {}),
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        nodeIntegration: true,
        contextIsolation: true,
        sandbox: false
      }
    })

    setupWindowControls(this.mainWindow)

    this.mainWindow.on('ready-to-show', () => {
      this.mainWindow?.show()
    })

    this.mainWindow.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return { action: 'deny' }
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      this.mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
      this.mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
  }

  test(): void {
    if (is.dev) {
      console.log('User data path:', app.getPath('userData'))
      console.log('App path:', app.getAppPath())

      // Test IPC
      if (this.mainWindow) {
        this.mainWindow.webContents.once('did-finish-load', () => {})
      }
    }
  }

  close(): void {
    vaultEvents.clearAllHandlers()

    db.destroy()

    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.close()
      this.mainWindow = null
    }
  }
}

app.whenReady().then(async () => {
  const appLifecycle = new AppLifecycle()

  try {
    await appLifecycle.init()
    appLifecycle.run()
    appLifecycle.test() // Only works in DEV mode
  } catch (error) {
    console.error('Failed to initialize application:', error)
    app.exit(1)
  }
})
