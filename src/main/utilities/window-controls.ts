import { ipcMain, BrowserWindow } from 'electron'

export function setupWindowControls(mainWindow: BrowserWindow): void {
  // Existing controls
  ipcMain.on('window:minimize', () => {
    mainWindow.minimize()
  })

  ipcMain.on('window:maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })

  ipcMain.on('window:close', () => {
    mainWindow.close()
  })

  ipcMain.on('window:get-maximized-state', () => {
    mainWindow.webContents.send('window:maximized-state', mainWindow.isMaximized())
  })

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window:maximized-state', true)
  })

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window:maximized-state', false)
  })
}