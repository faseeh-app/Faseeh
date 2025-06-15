import 'reflect-metadata'
import {
  ContentAdapterRegistration,
  ContentAdapterInfo,
  ContentAdapterResult,
  ContentAdapterFunction,
  IContentAdapterRegistry,
  ContentAdapterFindCriteria,
  CreateLibraryItemDTO,
  CreateEmbeddedAssetDTO,
  LibraryItem,
  CreateSupplementaryFileDTO,
  ContentAdapterSource,
  FaseehApp
} from '@shared/types/types'
import { StorageService } from '@renderer/core/services/storage/storage-service'

import { fileTypeFromBuffer } from 'file-type'

const { extname } = require('path')
const { ipcRenderer } = require('electron')

export class ContentAdapterRegistry implements IContentAdapterRegistry {
  private adapters: Map<string, ContentAdapterRegistration> = new Map()
  constructor(
    private storage: StorageService,
    private faseehAppInstance: FaseehApp
  ) {}

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
      app: FaseehApp
      originalPath?: string
      libraryItemId?: string | null
    }
  ): Promise<ContentAdapterResult> {
    console.log('invokeAdapterMethod called with registration:', registration)

    let adaptFn: ContentAdapterFunction
    if (registration.adapterClass) {
      console.log('Creating adapter instance from class:', registration.adapterClass)
      const adapterInstance = new registration.adapterClass(registration)
      console.log('Adapter instance created:', adapterInstance)
      console.log('Adapter instance adapt property:', adapterInstance.adapt)
      console.log('Type of adapt property:', typeof adapterInstance.adapt)

      adaptFn = adapterInstance.adapt

      if (!adaptFn) {
        console.error('adapt function is null/undefined on instance')
        return Promise.reject(
          new Error('Could not extract functions - adapt property is null/undefined')
        )
      }
    } else if (registration.adapter) {
      console.log('Using direct adapter function')
      adaptFn = registration.adapter
    } else {
      console.error('no adapter function found for registration', registration)
      return Promise.reject(new Error('Could not extract functions'))
    }

    console.log('About to call adaptFn with source:', source)
    return adaptFn(source, context)
  }
  private async saveAdapterResult(
    result: ContentAdapterResult,
    userMetadata?: Partial<LibraryItem>
  ): Promise<string> {
    const { libraryItemData, contentDocument, documentAssets, associatedFiles } = result
    const libraryItemId = libraryItemData.id || crypto.randomUUID()

    // Create a simplified dynamicMetadata without large objects like transcription segments
    const simplifiedMetadata = { ...libraryItemData.dynamicMetadata }
    if (simplifiedMetadata?.transcription?.segments) {
      // Keep only essential transcription info, not the full segments array
      simplifiedMetadata.transcription = {
        language: simplifiedMetadata.transcription.language,
        text: simplifiedMetadata.transcription.text?.substring(0, 500) + '...' // Truncate for metadata
      }
    }

    // Serialize the simplified metadata for SQLite storage
    const serializedDynamicMetadata = this.serializeMetadataForStorage(simplifiedMetadata || {})

    console.log('Original dynamicMetadata:', libraryItemData.dynamicMetadata)
    console.log('Simplified and serialized dynamicMetadata:', serializedDynamicMetadata)
    console.log('Type check of serialized metadata:')
    for (const [key, value] of Object.entries(serializedDynamicMetadata)) {
      console.log(
        `  ${key}: ${typeof value} ${Array.isArray(value) ? '(array)' : ''} ${Buffer.isBuffer(value) ? '(buffer)' : ''}`
      )
      if (typeof value === 'object' && value !== null && !Buffer.isBuffer(value)) {
        console.log(`    WARNING: Found non-serialized object for key ${key}:`, value)
      }
    }
    const newItemData: CreateLibraryItemDTO = {
      id: libraryItemId,
      type: userMetadata?.type || libraryItemData.type || 'unknown',
      dynamicMetadata: serializedDynamicMetadata,
      name: userMetadata?.name || libraryItemData.name || 'Untitled',
      language: userMetadata?.language || libraryItemData.language || undefined,
      sourceUri: libraryItemData.sourceUri || undefined,
      storagePath: libraryItemData.storagePath || undefined,
      contentDocumentPath: libraryItemData.contentDocumentPath || undefined,
      contentGroupId: libraryItemData.contentGroupId || undefined,
      groupOrder: libraryItemData.groupOrder || undefined
    }

    console.log('Complete newItemData being sent to storage:', JSON.stringify(newItemData, null, 2))
    console.log('contentDocument being sent to storage:', JSON.stringify(contentDocument, null, 2))

    const libraryItem = await this.storage.createLibraryItem(newItemData, contentDocument)

    if (!libraryItem?.id) {
      throw new Error('Failed to create library item')
    } // Thumbnail handling is now done separately in ImportDialog after successful import
    // This avoids conflicts and simplifies the flow

    if (documentAssets) {
      for (const [assetId, assetDetail] of Object.entries(documentAssets)) {
        // Create a more unique asset ID to avoid database conflicts
        const uniqueAssetId = `${libraryItem.id}_asset_${assetId}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
        const uniqueStoragePath = `${libraryItem.id}/assets/${uniqueAssetId}`

        const newAsset: CreateEmbeddedAssetDTO = {
          id: uniqueAssetId,
          libraryItemId: libraryItem.id,
          storagePath: uniqueStoragePath,
          format: assetDetail.format || 'application/octet-stream',
          sizeBytes: Buffer.isBuffer(assetDetail.content)
            ? assetDetail.content.length
            : Buffer.byteLength(assetDetail.content),
          originalSrc: undefined,
          width: undefined,
          height: undefined
        }

        await this.storage.createEmbeddedAsset(newAsset)
      }
    }
    if (associatedFiles) {
      for (const file of associatedFiles) {
        // Create more unique IDs and filenames to avoid database conflicts
        const timestamp = Date.now()
        const randomSuffix = Math.random().toString(36).substring(2, 15)
        const fileId = `${libraryItem.id}_file_${timestamp}_${randomSuffix}`

        // Preserve the original file extension
        const baseFilename = file.filename || `file_${timestamp}`
        const lastDotIndex = baseFilename.lastIndexOf('.')
        const extension = lastDotIndex > 0 ? baseFilename.substring(lastDotIndex) : ''
        const nameWithoutExtension =
          lastDotIndex > 0 ? baseFilename.substring(0, lastDotIndex) : baseFilename
        const uniqueFilename = `${libraryItem.id}_${nameWithoutExtension}_${timestamp}_${randomSuffix}${extension}`
        const uniqueStoragePath = `${libraryItem.id}/supplementary/${uniqueFilename}`

        try {
          // For now, we'll create the supplementary file record without the actual file
          // The file content will be available in the content document
          const newFile: CreateSupplementaryFileDTO = {
            id: fileId,
            libraryItemId: libraryItem.id,
            type: file.type,
            storagePath: uniqueStoragePath,
            filename: uniqueFilename,
            format: file.format || 'application/octet-stream',
            sizeBytes: Buffer.isBuffer(file.content)
              ? file.content.length
              : Buffer.byteLength(file.content),
            language: file.language
          }

          // Create the supplementary file record
          await this.storage.createSupplementaryFile(newFile)

          // Write the file content to disk
          const content = Buffer.isBuffer(file.content)
            ? file.content.toString('utf-8')
            : file.content
          const success = await this.storage.writeSupplementaryFileContent(
            libraryItem.id,
            uniqueFilename,
            content
          )

          if (success) {
            console.log(`Supplementary file ${uniqueFilename} saved successfully`)
          } else {
            console.error(`Failed to write content for supplementary file ${uniqueFilename}`)
          }
        } catch (error) {
          console.error(`Failed to save supplementary file ${uniqueFilename}:`, error)
          // Continue with other files even if one fails
        }
      }
    }

    return libraryItem.id
  }
  /**
   * Serialize complex metadata objects for SQLite storage
   * SQLite can only handle primitive types, so we need to stringify objects and arrays
   */
  private serializeMetadataForStorage(metadata: Record<string, any>): Record<string, any> {
    const serialized: Record<string, any> = {}

    for (const [key, value] of Object.entries(metadata)) {
      serialized[key] = this.serializeValue(value)
    }

    return serialized
  }

  private serializeValue(value: any): any {
    if (value === null || value === undefined) {
      return value
    } else if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      typeof value === 'bigint'
    ) {
      return value
    } else if (Buffer.isBuffer(value)) {
      return value
    } else if (Array.isArray(value)) {
      // For arrays, stringify the entire array
      return JSON.stringify(value)
    } else if (typeof value === 'object') {
      // For objects, stringify the entire object
      return JSON.stringify(value)
    } else {
      // For any other complex types, stringify them
      return JSON.stringify(value)
    }
  }
  async processSource(
    source: ContentAdapterSource,
    context?: {
      originalPath?: string
      sourceUrl?: string
      userMetadata?: Partial<LibraryItem>
    }
  ): Promise<{
    success: boolean
    libraryItemId?: string
    error?: string
  }> {
    console.log('processSource called with source:', source)
    const criteria = await this.sourceToCriteria(source, context)
    console.log('Generated criteria:', criteria)
    const adapter = this.findBestAdapter(criteria)
    console.log('Found adapter:', adapter)

    if (!adapter) {
      return {
        success: false,
        error: 'No suitable content adapter found for the provided source.'
      }
    }
    try {
      console.log('About to invoke adapter method')
      const result = await this.invokeAdapterMethod(adapter, source, {
        app: this.faseehAppInstance,
        originalPath: context?.originalPath
      })
      console.log('Adapter method result:', result)

      console.log('About to save adapter result')
      const libraryItemId = await this.saveAdapterResult(result, context?.userMetadata)
      console.log('Saved library item with ID:', libraryItemId)

      return {
        success: true,
        libraryItemId
      }
    } catch (error) {
      console.error('Error in processSource:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error processing source'
      }
    }
  }
}
