import type {
  LibraryItem,
  ContentDocument,
  VideoBlock,
  SubtitleGenerationResult,
  SupplementaryFile
} from '@shared/types/types'
import { SupplementaryFileType } from '@shared/types/models.d'
import { storage } from '@renderer/core/services/service-container'
// TODO: Import SubtitleParser when file reading is implemented
// import { SubtitleParser } from './subtitle-parser'
import type { SubtitleCue } from '../composables/useVideoPlayer'

/**
 * Utility functions for extracting video and subtitle data from LibraryItem
 * These functions handle the business logic of parsing LibraryItem data
 * for the video player component and integrate with the storage service.
 */

export interface VideoSource {
  url: string | null
  type: 'external' | 'asset' | 'fallback'
  assetId?: string
}

export interface SubtitleSource {
  cues: SubtitleCue[]
  language?: string
  source: 'generation' | 'file' | 'fallback'
  format?: string
  filename?: string
  storagePath?: string
}

/**
 * Extract video source information from a LibraryItem
 */
export function extractVideoSource(libraryItem: LibraryItem, fallbackUrl?: string): VideoSource {
  try {
    // First check if document is directly available
    let contentDoc: ContentDocument | null = null

    if (libraryItem.document) {
      contentDoc = libraryItem.document
    } else if (libraryItem.contentDocumentPath) {
      // TODO: Load document from storage service using contentDocumentPath
      console.warn('[VideoExtractor] ContentDocument loading from storage path not yet implemented')
      return { url: fallbackUrl || null, type: 'fallback' }
    } else {
      return { url: fallbackUrl || null, type: 'fallback' }
    }

    // Find the first VideoBlock in the content
    const videoBlock = contentDoc.contentBlocks?.find(
      (block): block is VideoBlock => block.type === 'video'
    )

    if (videoBlock) {
      // Return external source
      if (videoBlock.externalSrc) {
        return {
          url: videoBlock.externalSrc,
          type: 'external'
        }
      }
      // Return asset reference (requires storage service integration)
      else if (videoBlock.assetId && contentDoc.assets?.[videoBlock.assetId]) {
        console.warn('[VideoExtractor] Asset-based video URLs not yet implemented')
        return {
          url: fallbackUrl || null,
          type: 'asset',
          assetId: videoBlock.assetId
        }
      }
    }

    return { url: fallbackUrl || null, type: 'fallback' }
  } catch (error) {
    console.error('[VideoExtractor] Error parsing ContentDocument:', error)
    return { url: fallbackUrl || null, type: 'fallback' }
  }
}

/**
 * Extract subtitle information from a LibraryItem
 * This includes both generated subtitles and supplementary files
 */
export async function extractSubtitleSources(libraryItem: LibraryItem): Promise<SubtitleSource[]> {
  const sources: SubtitleSource[] = []

  // Extract subtitles from generation results in dynamicMetadata
  try {
    if (libraryItem.dynamicMetadata?.subtitleGenerationResult) {
      const result = libraryItem.dynamicMetadata
        .subtitleGenerationResult as SubtitleGenerationResult

      const cues: SubtitleCue[] = result.segments.map((segment, index) => ({
        id: `generated-${index}`,
        start: segment.startTimeMs / 1000, // Convert to seconds
        end: segment.endTimeMs / 1000,
        text: segment.text,
        words: [] // TODO: Implement word-level timing if available
      }))

      sources.push({
        cues,
        language: result.language,
        source: 'generation',
        format: result.raw?.format
      })
    }
  } catch (error) {
    console.error('[VideoExtractor] Error parsing subtitle generation result:', error)
  }
  // Extract subtitles from SupplementaryFiles using storage service
  try {
    // Note: This is now implemented with actual storage service integration
    const storageService = storage()

    // Get supplementary files for this library item
    const supplementaryFiles = await storageService.getSupplementaryFilesByLibraryItem(
      libraryItem.id,
      undefined, // type filter - get all types initially
      undefined // language filter - get all languages
    )

    // Filter for subtitle and transcript files
    const subtitleFiles = supplementaryFiles.filter(
      (file: SupplementaryFile) =>
        file.type === SupplementaryFileType.SUBTITLE ||
        file.type === SupplementaryFileType.TRANSCRIPT
    )

    // Load and parse each subtitle file
    for (const file of subtitleFiles) {
      try {
        // Get the absolute path to the subtitle file
        const filePath = await storageService.getSupplementaryFileAbsolutePath(file.id)

        if (filePath) {
          console.log(
            `[VideoExtractor] Found subtitle file: ${file.filename || file.storagePath} at ${filePath}`
          )

          // TODO: Add file reading capability to storage service or use fs directly
          // For now, we'll create a placeholder subtitle source
          // const content = await fs.readFile(filePath, 'utf-8')
          // const parsed = SubtitleParser.parse(content, file.format as any)

          // Placeholder for actual file content parsing
          sources.push({
            cues: [], // Will be populated when file reading is implemented
            language: file.language || 'unknown',
            source: 'file',
            format: file.format || 'unknown',
            filename: file.filename,
            storagePath: file.storagePath
          })
        }
      } catch (error) {
        console.error(`[VideoExtractor] Error loading subtitle file ${file.filename}:`, error)
      }
    }
  } catch (error) {
    console.error('[VideoExtractor] Error processing supplementary files:', error)
  }

  return sources
}

/**
 * Get the best subtitle source from available sources
 * Prioritizes generation results over files, but this can be customized
 */
export function getBestSubtitleSource(
  sources: SubtitleSource[],
  preferredLanguage?: string
): SubtitleSource | null {
  if (sources.length === 0) return null

  // If preferred language is specified, try to find a match
  if (preferredLanguage) {
    const languageMatch = sources.find((source) => source.language === preferredLanguage)
    if (languageMatch) return languageMatch
  }

  // Otherwise, prioritize by source type (generation > file)
  const generationSource = sources.find((source) => source.source === 'generation')
  if (generationSource) return generationSource

  const fileSource = sources.find((source) => source.source === 'file')
  if (fileSource) return fileSource

  // Return the first available source
  return sources[0]
}

/**
 * Utility function to combine multiple subtitle sources
 * Useful when displaying multiple language tracks or different sources
 */
export function combineSubtitleSources(sources: SubtitleSource[]): SubtitleCue[] {
  const allCues: SubtitleCue[] = []

  sources.forEach((source) => {
    allCues.push(...source.cues)
  })

  // Sort by start time
  return allCues.sort((a, b) => a.start - b.start)
}

/**
 * Create a demo LibraryItem for testing purposes
 */
export function createDemoLibraryItem(videoUrl: string, includeSubtitles = true): LibraryItem {
  const now = new Date()

  return {
    id: `demo-${Date.now()}`,
    type: 'video',
    name: 'Demo Video',
    language: 'en',
    sourceUri: videoUrl,
    dynamicMetadata: includeSubtitles
      ? {
          subtitleGenerationResult: {
            language: 'en',
            segments: [
              {
                startTimeMs: 0,
                endTimeMs: 4000,
                text: 'Welcome to the LibraryItem-based video player!',
                confidence: 0.95
              },
              {
                startTimeMs: 5000,
                endTimeMs: 9000,
                text: 'This player extracts video information from ContentDocument.',
                confidence: 0.92
              },
              {
                startTimeMs: 10000,
                endTimeMs: 14000,
                text: 'Subtitles can come from SupplementaryFiles or generated results.',
                confidence: 0.88
              }
            ]
          }
        }
      : {},
    createdAt: now,
    updatedAt: now,
    document: {
      version: '1.0',
      metadata: {
        title: 'Demo Video',
        language: 'en'
      },
      contentBlocks: [
        {
          id: 'video-1',
          type: 'video',
          order: 1,
          externalSrc: videoUrl
        }
      ]
    }
  }
}
