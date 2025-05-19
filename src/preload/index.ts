import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { storageApi } from './storage/storage-api'

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    try {
      contextBridge.exposeInMainWorld('storageAPI', storageApi)
    } catch (error) {
      console.error('Failed to expose storageAPI to the main world:', error)
    }
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
