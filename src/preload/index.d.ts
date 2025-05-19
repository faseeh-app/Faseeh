import { ElectronAPI } from '@electron-toolkit/preload'
import type { IStorageAPI } from '@renderer/core/types/storage-api'

declare global {
  interface Window {
    electron: ElectronAPI
    storageAPI: IStorageAPI
  }
}
