/** Represents a positional bounding box */
export interface BoundingBox {
  x: number // Top-left X or Left offset
  y: number // Top-left Y or Top offset
  width: number // Width of the box
  height: number // Height of the box
  unit: 'px' | '%' | 'relative' // Coordinate system unit
}

/** Basic properties common to all blocks */
export interface BaseBlock {
  id: string // Unique within the document
  order: number // Display/reading order
  position?: BoundingBox // Optional absolute positioning for layout-sensitive content
}

/** Represents a block of text */
export interface TextBlock extends BaseBlock {
  type: 'text'
  content: string
  style?: string // e.g., 'paragraph', 'h1', 'li', 'caption'
  language?: string // Specific language if different from document default
}

/** Represents an image */
export interface ImageBlock extends BaseBlock {
  type: 'image'
  assetId?: string // Refers to key in FaseehContentDocument.assets (for embedded/managed images)
  externalSrc?: string // URL if image is hosted externally
  alt?: string // Alt text
  caption?: string // Associated caption text
}

/** Represents a video embed */
export interface VideoBlock extends BaseBlock {
  type: 'video'
  assetId?: string // Refers to a managed video asset
  externalSrc?: string // URL to video (e.g., YouTube, Vimeo, or direct file)
}

/** Represents an audio embed */
export interface AudioBlock extends BaseBlock {
  type: 'audio'
  assetId?: string // Refers to a managed audio asset
  externalSrc?: string // URL to audio file
}

/** Represents a single text annotation on an image */
export interface ImageAnnotation {
  id: string // Unique within the parent block
  text: string
  boundingBox: BoundingBox // Position RELATIVE TO THE BASE IMAGE
  type: 'dialogue' | 'sfx' | 'narration' | 'label' | 'caption' | 'title' | 'other' // Semantic type
  order: number // Reading order of annotations on the image
  language?: string
}

/** Represents an image with annotated text regions (comics, diagrams) */
export interface AnnotatedImageBlock extends BaseBlock {
  type: 'annotatedImage'
  baseImageAssetId: string // Refers to key in FaseehContentDocument.assets
  annotations: ImageAnnotation[] // Array of text annotations on this image
}

/** Represents a structural container for other blocks */
export interface ContainerBlock extends BaseBlock {
  type: 'container'
  style?: string // e.g., 'section', 'panel', 'figure', 'div'
  children: ContentBlock[] // Nested blocks within this container
}

/** Union type for all possible content blocks */
export type ContentBlock =
  | TextBlock
  | ImageBlock
  | VideoBlock
  | AudioBlock
  | AnnotatedImageBlock
  | ContainerBlock

/** Represents structured, processed content ready for display/interaction */
export interface ContentDocument {
  version: string // Schema version
  metadata: {
    title?: string
    language?: string
  }
  assets?: {
    // Describes assets STORED SEPARATELY by Storage Service
    [assetId: string]: {
      format: string
      originalSrc?: string
      width?: number
      height?: number
      // Refers to stored asset path implicitly or explicitly via Storage Service lookup
    }
  }
  contentBlocks: ContentBlock[] // Ordered array of content blocks
}
