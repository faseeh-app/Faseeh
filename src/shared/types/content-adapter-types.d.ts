import { FaseehApp } from '@shared/types/types'
export type ContentAdapterSource = string | Buffer | File
import { LibraryItem } from '@shared/types/models'
import { ContentDocument } from '@shared/types/types'
import { ContentAdapter } from '@root/src/renderer/src/core/services/content-adapter/content-adapter'
export interface AssetDetail {
  format: string
  content: Buffer | string
}

export interface DocumentAssets {
  [assetId: string]: AssetDetail
}

export interface ContentAdapterResult {
  libraryItemData: Partial<LibraryItem>
  contentDocument?: ContentDocument

  documentAssets?: DocumentAssets

  associatedFiles?: {
    type: string
    format?: string
    language?: string
    filename?: string
    content: string | Buffer
  }[]
}

// _______________ Adapter Definition types _______________

export type ContentAdapterFunction = (
  source: ContentAdapterSource,
  context: {
    app: Pick<FaseehApp, 'storage' | 'plugins'>
    originalPath?: string
    libraryItemId?: string | null
  }
) => Promise<ContentAdapterResult>

export interface ContentAdapterInfo {
  id: string
  name: string
  supportedMimeTypes: string[]

  supportedExtensions: string[]

  urlPatterns?: string[] | RegExp[]
  canHandlePastedText?: boolean

  priority?: number

  description?: string
}

// _______________ Adapter Registration types _______________

export type ContentAdapterClass = new (info: ContentAdapterInfo) => ContentAdapter

export type ContentAdapterRegistration = ContentAdapterInfo &
  (
    | {
        adapter: ContentAdapterFunction
        adapterClass?: undefined
      }
    | {
        adapterClass: ContentAdapterClass
        adapter?: undefined
      }
  )
