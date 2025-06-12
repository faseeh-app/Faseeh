import {
  ContentAdapterRegistration,
  ContentAdapterInfo,
  ContentAdapterResult,
  ContentAdapterFunction,
  IContentAdapterRegistry,
  ContentAdapterFindCriteria,
  CreateLibraryItemDTO,
  CreateEmbeddedAssetDTO,
  CreateSupplementaryFileDTO,
  ContentAdapterSource,
  FaseehApp
} from '@shared/types/types'

import { extname } from 'path'
import { fileTypeFromBuffer } from 'file-type'

export class ContentAdapterRegistry implements IContentAdapterRegistry {
  private adapters: Map<string, ContentAdapterRegistration> = new Map()

  private app: Pick<FaseehApp, 'storage' | 'plugins'>

  constructor(app: Pick<FaseehApp, 'storage' | 'plugins'>) {
    this.app = app
  }

  register(registration: ContentAdapterRegistration): void {
    if (this.adapters.has(registration.id)) {
      throw new Error(`Content adapter with id ${registration.id} is already registered.`)
    }

    this.adapters.set(registration.id, registration)
  }

  unregister(id: string): void {
    if (!this.adapters.has(id)) {
      throw new Error(`Content adapter with id ${id} is not registered.`)
    }

    this.adapters.delete(id)
  }

  private findBestAdapter(criteria: ContentAdapterFindCriteria): ContentAdapterRegistration | null {
    let bestAdapter: ContentAdapterRegistration | null = null
    let highestScore = 0
    let highestPriority = -Infinity

    for (const registration of this.adapters.values()) {
      const adapterInfo: ContentAdapterInfo = registration
      let score = 0

      if (criteria.mimeType && adapterInfo.supportedMimeTypes.includes(criteria.mimeType)) {
        score += 3
      }

      if (
        criteria.fileExtension &&
        adapterInfo.supportedExtensions.includes(criteria.fileExtension)
      ) {
        score += 3
      }

      if (criteria.sourceUrl && adapterInfo.urlPatterns?.length) {
        for (const pattern of adapterInfo.urlPatterns) {
          try {
            const regex = new RegExp(pattern)
            if (regex.test(criteria.sourceUrl)) {
              score += 2
              break
            }
          } catch (e) {
            console.error(`Invalid regex pattern "${pattern}" in adapter ${adapterInfo.id}:`, e)
            continue
          }
        }
      }

      if (criteria.isPastedText && adapterInfo.canHandlePastedText) {
        score += 2
      }

      if (score === 0) continue

      const priority = adapterInfo.priority ?? 0

      if (score > highestScore || (score === highestScore && priority > highestPriority)) {
        bestAdapter = registration
        highestScore = score
        highestPriority = priority
      }
    }

    return bestAdapter
  }

  getAdapterById(id: string): ContentAdapterRegistration | null {
    return this.adapters.get(id) ?? null
  }

  listRegisteredAdapters(): ContentAdapterRegistration[] {
    return Array.from(this.adapters.values())
  }
  private async sourceToCriteria(
    source: ContentAdapterSource,
    context?: {
      originalPath?: string
      sourceUrl?: string
    }
  ): Promise<ContentAdapterFindCriteria> {
    const criteria: ContentAdapterFindCriteria = { source }

    await this.handleSourceType(source, criteria)
    this.applyContextInformation(criteria, context)

    return criteria
  }

  private async handleSourceType(
    source: ContentAdapterSource,
    criteria: ContentAdapterFindCriteria
  ): Promise<void> {
    if (typeof source === 'string') {
      this.handleStringSource(source, criteria)
    } else if (source instanceof File) {
      this.handleFileSource(source, criteria)
    } else if (Buffer.isBuffer(source)) {
      await this.handleBufferSource(source, criteria)
    }
  }

  private handleStringSource(source: string, criteria: ContentAdapterFindCriteria): void {
    try {
      const url = new URL(source)
      criteria.sourceUrl = url.href
      const ext = extname(url.pathname).toLowerCase()
      criteria.fileExtension = ext ? ext.slice(1) : undefined
    } catch {
      criteria.isPastedText = true
    }
  }

  private handleFileSource(file: File, criteria: ContentAdapterFindCriteria): void {
    criteria.mimeType = file.type || undefined
    criteria.fileExtension = extname(file.name).slice(1).toLowerCase()
  }

  private async handleBufferSource(
    buffer: Buffer,
    criteria: ContentAdapterFindCriteria
  ): Promise<void> {
    try {
      const result = await fileTypeFromBuffer(buffer)
      if (result) {
        criteria.mimeType = result.mime
        criteria.fileExtension = result.ext.toLowerCase()
      } else {
        criteria.mimeType = 'application/octet-stream'
      }
    } catch {
      criteria.mimeType = 'application/octet-stream'
    }
  }

  private applyContextInformation(
    criteria: ContentAdapterFindCriteria,
    context?: { originalPath?: string; sourceUrl?: string }
  ): void {
    if (context?.originalPath && !criteria.fileExtension) {
      const ext = extname(context.originalPath).toLowerCase()
      criteria.fileExtension = ext ? ext.slice(1) : undefined
    }

    if (context?.sourceUrl && !criteria.sourceUrl) {
      criteria.sourceUrl = context.sourceUrl
    }
  }

  private async invokeAdapterMethod(
    registration: ContentAdapterRegistration,
    source: ContentAdapterSource,
    context: {
      app: Pick<FaseehApp, 'storage' | 'plugins'>
      originalPath?: string
      libraryItemId?: string | null
    }
  ): Promise<ContentAdapterResult> {
    let adaptFn: ContentAdapterFunction
    if (registration.adapterClass) {
      const adapterInstance = new registration.adapterClass(registration)
      adaptFn = adapterInstance.adapt.bind(adapterInstance)
    } else if (registration.adapter) {
      adaptFn = registration.adapter
    } else {
      console.error('no adapter function found for registration', registration)
      return Promise.reject(new Error('No adapter function found for registration'))
    }
    return adaptFn(source, context)
  }

  private async saveAdapterResult(result: ContentAdapterResult): Promise<string> {
    const { libraryItemData, contentDocument, documentAssets, associatedFiles } = result
    const libraryItemId = libraryItemData.id || crypto.randomUUID()

    const newItemData: CreateLibraryItemDTO = {
      id: libraryItemId,
      type: libraryItemData.type || 'unknown',
      dynamicMetadata: libraryItemData.dynamicMetadata || {},
      name: libraryItemData.name || 'Untitled',
      language: libraryItemData.language,
      sourceUri: libraryItemData.sourceUri,
      storagePath: libraryItemData.storagePath,
      contentDocumentPath: libraryItemData.contentDocumentPath,
      contentGroupId: libraryItemData.contentGroupId,
      groupOrder: libraryItemData.groupOrder
    }

    const libraryItem = await this.app.storage.createLibraryItem(newItemData, contentDocument)

    if (!libraryItem?.id) {
      throw new Error('Failed to create library item')
    }

    if (documentAssets) {
      for (const [assetId, assetDetail] of Object.entries(documentAssets)) {
        const newAsset: CreateEmbeddedAssetDTO = {
          id: assetId,
          libraryItemId: libraryItem.id,
          storagePath: assetId,
          format: assetDetail.format || 'application/octet-stream',
          sizeBytes: Buffer.isBuffer(assetDetail.content)
            ? assetDetail.content.length
            : Buffer.byteLength(assetDetail.content),
          originalSrc: undefined,
          width: undefined,
          height: undefined
        }

        await this.app.storage.createEmbeddedAsset(newAsset)
      }
    }

    if (associatedFiles) {
      for (const file of associatedFiles) {
        const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`

        const newFile: CreateSupplementaryFileDTO = {
          id: fileId,
          libraryItemId: libraryItem.id,
          type: file.type,
          storagePath: file.filename || `file_${Date.now()}`,
          filename: file.filename || `file_${Date.now()}`,
          format: file.format || 'application/octet-stream',
          sizeBytes: Buffer.isBuffer(file.content)
            ? file.content.length
            : Buffer.byteLength(file.content),
          language: file.language
        }

        await this.app.storage.createSupplementaryFile(newFile)
      }
    }

    return libraryItem.id
  }

  async processSource(
    source: ContentAdapterSource,
    context?: {
      originalPath?: string
      sourceUrl?: string
    }
  ): Promise<{
    success: boolean
    libraryItemId?: string
    error?: string
  }> {
    const criteria = await this.sourceToCriteria(source, context)
    const adapter = this.findBestAdapter(criteria)

    if (!adapter) {
      return {
        success: false,
        error: 'No suitable content adapter found for the provided source.'
      }
    }

    try {
      const result = await this.invokeAdapterMethod(adapter, source, {
        app: this.app,
        originalPath: context?.originalPath
      })

      const libraryItemId = await this.saveAdapterResult(result)

      return {
        success: true,
        libraryItemId
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error processing source'
      }
    }
  }
}
