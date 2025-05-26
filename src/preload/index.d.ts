import { ElectronAPI } from '@electron-toolkit/preload'
import type { IStorageAPI } from '@shared/types/storage-api'
import type { IEventsBridge } from '@shared/types/events-bridge'

declare global {
  interface Window {
    eventsBridge: IEventsBridge
    electron: ElectronAPI
    storageAPI: IStorageAPI
  }
}
