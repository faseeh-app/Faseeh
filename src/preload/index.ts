import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { storageApi } from './storage/storage-api'
import type { IEventsBridge } from '@shared/types/events-bridge'

// Custom APIs for renderer
const api = {}

const eventsBridge: IEventsBridge = {
  send: (channel: string, data: any) => {
    ipcRenderer.send('ipc-event', channel, data)
  },

  on: (callback: (channel: string, data: any) => void) => {
    const subscription = (_event: any, channel: string, data: any) => {
      callback(channel, data)
    }
    ipcRenderer.on('ipc-event', subscription)

    return () => {
      ipcRenderer.removeListener('ipc-event', subscription)
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('eventsBridge', eventsBridge)
    contextBridge.exposeInMainWorld('storageAPI', storageApi)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
