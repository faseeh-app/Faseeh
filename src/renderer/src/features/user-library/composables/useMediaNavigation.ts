import { useTabRouter } from '@renderer/common/services/tabRouter'
import { RouteNames } from '@renderer/common/router/routes'

/**
 * Media item interface for navigation
 */
export interface MediaItem {
  id: string
  title: string
  type: 'video' | 'document'
}

/**
 * Composable for media navigation using the MediaLayout
 */
export function useMediaNavigation() {
  const tabRouter = useTabRouter()

  /**
   * Open a video in the media layout
   */
  const openVideo = async (videoItem: MediaItem, options?: { newTab?: boolean }) => {
    return await tabRouter.push(
      {
        name: RouteNames.VIDEO_PLAYER,
        params: { id: videoItem.id }
      },
      {
        title: videoItem.title,
        newTab: options?.newTab || false
      }
    )
  }

  /**
   * Open a document in the media layout
   */
  const openDocument = async (documentItem: MediaItem, options?: { newTab?: boolean }) => {
    return await tabRouter.push(
      {
        name: RouteNames.DOCUMENT_VIEWER,
        params: { id: documentItem.id }
      },
      {
        title: documentItem.title,
        newTab: options?.newTab || false
      }
    )
  }

  /**
   * Generic media opener that detects type automatically
   */
  const openMedia = async (mediaItem: MediaItem, options?: { newTab?: boolean }) => {
    if (mediaItem.type === 'video') {
      return await openVideo(mediaItem, options)
    } else if (mediaItem.type === 'document') {
      return await openDocument(mediaItem, options)
    } else {
      throw new Error(`Unsupported media type: ${mediaItem.type}`)
    }
  }

  /**
   * Open media with support for Ctrl+Click to open in new tab
   */
  const openMediaWithModifiers = async (
    mediaItem: MediaItem,
    event?: MouseEvent | KeyboardEvent
  ) => {
    const newTab = event ? event.ctrlKey || event.metaKey : false
    return await openMedia(mediaItem, { newTab })
  }

  return {
    openVideo,
    openDocument,
    openMedia,
    openMediaWithModifiers
  }
}
