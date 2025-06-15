import type {
  LibraryItem,
  ContentDocument,
  VideoBlock,
  SubtitleGenerationResult,
  SupplementaryFile
} from '@shared/types/types'
import { SupplementaryFileType } from '@shared/types/models.d'
import { storage } from '@renderer/core/services/service-container'
import { parseSubtitleFile } from './subtitle-parser'
import type { SubtitleCue } from '../composables/useVideoPlayer'

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

export function extractVideoSource(libraryItem: LibraryItem, fallbackUrl?: string): VideoSource {
  try {
    if (libraryItem.sourceUri && libraryItem.sourceUri.trim() !== '') {
      return {
        url: libraryItem.sourceUri,
        type: 'external'
      }
    }

    let contentDoc: ContentDocument | null = null

    if (libraryItem.document) {
      contentDoc = libraryItem.document
    } else if (libraryItem.contentDocumentPath) {
      return { url: fallbackUrl || null, type: 'fallback' }
    } else {
      return { url: fallbackUrl || null, type: 'fallback' }
    }

    const videoBlock = contentDoc.contentBlocks?.find(
      (block): block is VideoBlock => block.type === 'video'
    )

    if (videoBlock) {
      if (videoBlock.externalSrc) {
        return {
          url: videoBlock.externalSrc,
          type: 'external'
        }
      } else if (videoBlock.assetId && contentDoc.assets?.[videoBlock.assetId]) {
        return {
          url: fallbackUrl || null,
          type: 'asset',
          assetId: videoBlock.assetId
        }
      }
    }

    return { url: fallbackUrl || null, type: 'fallback' }
  } catch (error) {
    return { url: fallbackUrl || null, type: 'fallback' }
  }
}

export async function extractSubtitleSources(libraryItem: LibraryItem): Promise<SubtitleSource[]> {
  const sources: SubtitleSource[] = []

  try {
    if (libraryItem.dynamicMetadata?.subtitleGenerationResult) {
      const result = libraryItem.dynamicMetadata
        .subtitleGenerationResult as SubtitleGenerationResult

      const cues: SubtitleCue[] = result.segments.map((segment, index) => ({
        id: `generated-${index}`,
        start: segment.startTimeMs / 1000,
        end: segment.endTimeMs / 1000,
        text: segment.text,
        words: []
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

  try {
    const storageService = storage()

    const supplementaryFiles = await storageService.getSupplementaryFilesByLibraryItem(
      libraryItem.id,
      undefined,
      undefined
    )

    const subtitleFiles = supplementaryFiles.filter(
      (file: SupplementaryFile) =>
        file.type === SupplementaryFileType.SUBTITLE ||
        file.type === SupplementaryFileType.TRANSCRIPT
    )

    for (const file of subtitleFiles) {
      try {
        const content = await storageService.readSupplementaryFileContent(
          libraryItem.id,
          file.filename || file.storagePath || ''
        )

        if (content) {
          const cues = parseSubtitleFile(content, file.filename)

          sources.push({
            cues,
            language: file.language || 'unknown',
            source: 'file',
            format: file.format || 'unknown',
            filename: file.filename,
            storagePath: file.storagePath
          })
        } else {
          console.warn(
            `[VideoExtractor] Could not read content for subtitle file: ${file.filename}`
          )
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

export function getBestSubtitleSource(
  sources: SubtitleSource[],
  preferredLanguage?: string
): SubtitleSource | null {
  if (sources.length === 0) return null

  if (preferredLanguage) {
    const languageMatch = sources.find((source) => source.language === preferredLanguage)
    if (languageMatch) return languageMatch
  }

  const generationSource = sources.find((source) => source.source === 'generation')
  if (generationSource) return generationSource

  const fileSource = sources.find((source) => source.source === 'file')
  if (fileSource) return fileSource

  return sources[0]
}

export function combineSubtitleSources(sources: SubtitleSource[]): SubtitleCue[] {
  const allCues: SubtitleCue[] = []
  sources.forEach((source) => {
    allCues.push(...source.cues)
  })

  return allCues.sort((a, b) => a.start - b.start)
}

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
