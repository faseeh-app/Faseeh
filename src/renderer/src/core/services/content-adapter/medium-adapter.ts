import {
  ContentAdapterInfo,
  ContentAdapterResult,
  ContentAdapterSource,
  DocumentAssets
} from '@shared/types/content-adapter-types'
import { ContentAdapter } from '@renderer/core/services/content-adapter'
import {
  ContentBlock,
  ImageBlock,
  TextBlock,
  ContentDocument,
  FaseehApp
} from '@shared/types/types'

import { JSDOM } from 'jsdom'
import fetch from 'node-fetch'

export class MediumAdapter extends ContentAdapter {
  static readonly info: ContentAdapterInfo = {
    id: 'medium-adapter',
    name: 'Medium',
    supportedMimeTypes: ['text/html'],
    supportedExtensions: ['html', 'htm'],
    urlPatterns: [
      /^https?:\/\/(www\.)?medium\.com\//,
      /^https?:\/\/[a-zA-Z0-9-]+\.medium\.com\//,
      /^https?:\/\/medium\.com\/@/,
      /^https?:\/\/medium\.com\/p\//
    ],
    canHandlePastedText: true,
    priority: 5,
    description: 'Extracts articles and images from Medium.com'
  }

  constructor() {
    super(MediumAdapter.info)
  }

  adapt = async (
    source: ContentAdapterSource,
    context: {
      app: Pick<FaseehApp, 'storage' | 'plugins'>
      originalPath?: string
      libraryItemId?: string | null
    }
  ): Promise<ContentAdapterResult> => {
    let htmlContent: string
    let sourceUrl: string | undefined

    if (typeof source === 'string') {
      if (this.isUrl(source)) {
        sourceUrl = source
        htmlContent = await this.fetchMediumArticle(source)
      } else {
        htmlContent = source
      }
    } else if (source instanceof File) {
      htmlContent = await this.fileToString(source)
    } else if (Buffer.isBuffer(source)) {
      htmlContent = source.toString('utf-8')
    } else {
      throw new Error('Unsupported source type')
    }

    const dom = new JSDOM(htmlContent)
    const document = dom.window.document

    const metadata = this.extractMetadata(document)

    const { contentBlocks, documentAssets } = await this.extractContent(document)

    const libraryItemData = {
      id: context.libraryItemId ?? this.generateUUID(),
      type: 'article' as const,
      name: metadata.title ?? 'Medium Article',
      language: metadata.language ?? 'en',
      sourceUri: sourceUrl,
      dynamicMetadata: {
        author: metadata.author,
        publishDate: metadata.publishDate,
        readTime: metadata.readTime,
        tags: metadata.tags,
        subtitle: metadata.subtitle
      }
    }

    const contentDocument: ContentDocument = {
      version: '1.0.0',
      metadata: {
        title: metadata.title,
        language: metadata.language ?? 'en'
      },
      assets: this.createAssetsMap(documentAssets),
      contentBlocks
    }

    return {
      libraryItemData,
      contentDocument,
      documentAssets,
      associatedFiles: []
    }
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0
      const v = c == 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  private isUrl(str: string): boolean {
    try {
      new URL(str)
      return true
    } catch {
      return false
    }
  }

  private async fetchMediumArticle(url: string): Promise<string> {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        const errorMsg = `Failed to fetch article: ${response.statusText}`
        throw new Error(errorMsg)
      }
      return await response.text()
    } catch (error) {
      if (error instanceof Error && error.message.includes('Failed to fetch article:')) {
        throw new Error(`Failed to fetch Medium article: ${error.message}`)
      }
      throw new Error(`Failed to fetch Medium article: ${error}`)
    }
  }

  private async fileToString(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  private extractMetadata(
    document: Document,

  ): {
    title?: string
    author?: string
    publishDate?: string
    readTime?: string
    subtitle?: string
    language?: string
    tags: string[]
  } {
    const title =
      document.querySelector('meta[property="og:title"]')?.getAttribute('content') ??
      document.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ??
      document.querySelector('h1')?.textContent ??
      document.title

    const author =
      document.querySelector('meta[name="author"]')?.getAttribute('content') ??
      document.querySelector('[rel="author"]')?.textContent ??
      document.querySelector('.author-name')?.textContent

    const publishDate =
      document.querySelector('meta[property="article:published_time"]')?.getAttribute('content') ??
      document.querySelector('time')?.getAttribute('datetime')

    const readTime =
      document.querySelector('.reading-time')?.textContent ??
      document.querySelector('[data-testid="storyReadTime"]')?.textContent

    const subtitle =
      document.querySelector('meta[property="og:description"]')?.getAttribute('content') ??
      document.querySelector('meta[name="description"]')?.getAttribute('content')

    const language =
      document.documentElement.lang ??
      document.querySelector('meta[http-equiv="content-language"]')?.getAttribute('content') ??
      'en'

    const tagElements = document.querySelectorAll('a[href*="/tag/"], .tags a, [data-testid="tag"]')
    const tags = Array.from(tagElements)
      .map((el) => el.textContent?.trim())
      .filter(Boolean) as string[]

    return {
      title: title || undefined,
      author: author || undefined,
      publishDate: publishDate || undefined,
      readTime: readTime || undefined,
      subtitle: subtitle || undefined,
      language: language || undefined,
      tags
    }
  }

  private async extractContent(document: Document): Promise<{
    contentBlocks: ContentBlock[]
    documentAssets: DocumentAssets
  }> {
    const contentBlocks: ContentBlock[] = []
    const documentAssets: DocumentAssets = {}

    const articleSelectors = [
      'article',
      '[data-testid="storyContent"]',
      '.postArticle-content',
      '.section-content',
      'main'
    ]

    let articleElement: Element | null = null
    for (const selector of articleSelectors) {
      articleElement = document.querySelector(selector)
      if (articleElement) break
    }

    if (!articleElement) {
      articleElement = document.body
    }

    const elements = articleElement.querySelectorAll('p, h1, h2, h3, h4, h5, h6, img, figure, div')

    const allImages = articleElement.querySelectorAll(
      `img,
      figure img,
      div img,
      picture img,
      [role="img"],
      img[class*="bh"],
      img[class*="pi"],
      img[class*="rm"],
      img[class*="c"],
      img[width],
      img[height],
      img[loading="eager"],
      img[role="presentation"]`
        .replace(/\s+/g, ' ')
        .trim()
    )

    const processedImageSrcs = new Set<string>()

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i]

      if (element.tagName.toLowerCase() === 'img' || element.querySelector('img')) {
        const imgBlock = this.processImage(element, i, processedImageSrcs)
        if (imgBlock) {
          contentBlocks.push(imgBlock)
        }
      } else if (
        ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(element.tagName.toLowerCase())
      ) {
        const textBlock = this.processText(element, i)
        if (textBlock) {
          contentBlocks.push(textBlock)
        }
      }
    }

    for (let i = 0; i < allImages.length; i++) {
      const img = allImages[i] as HTMLImageElement
      if (img.src && !processedImageSrcs.has(img.src)) {
        const imgBlock = this.processImage(img, elements.length + i, processedImageSrcs)
        if (imgBlock) {
          contentBlocks.push(imgBlock)
        }
      }
    }

    return { contentBlocks, documentAssets }
  }

  private processImage(
    element: Element,
    index: number,
    processedImageSrcs?: Set<string>
  ): ImageBlock | null {
    const img =
      element.tagName.toLowerCase() === 'img'
        ? (element as HTMLImageElement)
        : (element.querySelector('img') as HTMLImageElement)

    if (!img) return null

    let imgSrc = img.src
    if (
      !imgSrc ||
      imgSrc === '' ||
      imgSrc === 'data:,' ||
      imgSrc.startsWith('data:image/svg+xml')
    ) {
      imgSrc =
        img.getAttribute('data-src') ||
        img.getAttribute('data-lazy-src') ||
        img.getAttribute('data-original') ||
        img.getAttribute('data-srcset')?.split(' ')[0] ||
        ''

      if (!imgSrc && img.parentElement?.tagName === 'PICTURE') {
        const picture = img.parentElement
        const sources = picture.querySelectorAll('source')
        for (const source of sources) {
          const srcset = source.getAttribute('srcset')
          if (srcset) {
            const firstUrl = srcset.split(',')[0].trim().split(' ')[0]
            if (firstUrl) {
              imgSrc = firstUrl
              break
            }
          }
        }
      }
    }

    if (!imgSrc) {
      return null
    }

    if (processedImageSrcs) {
      if (processedImageSrcs.has(imgSrc)) {
        return null
      }
      processedImageSrcs.add(imgSrc)
    }

    const alt = img.alt ?? img.getAttribute('aria-label') ?? ''

    const caption = this.extractImageCaption(element)

    const imageBlock: ImageBlock = {
      id: this.generateUUID(),
      type: 'image',
      order: index,
      externalSrc: imgSrc,
      alt,
      caption
    }

    return imageBlock
  }

  private extractImageCaption(element: Element): string | undefined {
    const captionSelectors = ['figcaption', '.image-caption', '.caption', '[data-testid="caption"]']

    for (const selector of captionSelectors) {
      const caption = element.querySelector(selector)?.textContent?.trim()
      if (caption) return caption
    }

    const parentFigure = element.closest('figure')
    if (parentFigure) {
      for (const selector of captionSelectors) {
        const caption = parentFigure.querySelector(selector)?.textContent?.trim()
        if (caption) return caption
      }
    }

    return undefined
  }

  private processText(element: Element, index: number): TextBlock | null {
    const content = element.textContent?.trim()
    if (!content) return null

    const tagName = element.tagName.toLowerCase()

    const styleMap: Record<string, string> = {
      h1: 'heading1',
      h2: 'heading2',
      h3: 'heading3',
      h4: 'heading4',
      h5: 'heading5',
      h6: 'heading6',
      p: 'paragraph'
    }

    const style = styleMap[tagName]

    const textBlock: TextBlock = {
      id: this.generateUUID(),
      type: 'text',
      order: index,
      content,
      style
    }

    return textBlock
  }

  private createAssetsMap(
    assets: DocumentAssets
  ): Record<string, { format: string; width?: number; height?: number; originalSrc?: string }> {
    const assetsMap: Record<
      string,
      { format: string; width?: number; height?: number; originalSrc?: string }
    > = {}

    for (const [assetId, asset] of Object.entries(assets)) {
      assetsMap[assetId] = {
        format: asset.format,
        width: undefined,
        height: undefined,
        originalSrc: undefined
      }
    }

    return assetsMap
  }
}
