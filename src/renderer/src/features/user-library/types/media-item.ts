export interface MediaItem {
  id: string
  title: string
  subtitle?: string
  type: 'video' | 'audio' | 'document' | 'collection' | 'article'
  duration?: string
  language?: string
  thumbnail?: string
}
