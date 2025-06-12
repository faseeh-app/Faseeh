import { JSDOM } from 'jsdom';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';
import { ContentAdapter } from '../content-adapter';
import { ContentAdapterFunction, ContentAdapterResult } from '@shared/types/content-adapter-types';
import { ContentDocument, TextBlock, ImageBlock } from '@shared/types/types';

export class HespressAdapter extends ContentAdapter {
  constructor() {
    super({
      id: 'hespress',
      name: 'Hespress News',
      supportedMimeTypes: ['text/html'],
      supportedExtensions: ['html'],
      urlPatterns: [/^https?:\/\/(www\.)?hespress\.com\/.+/i],
      canHandlePastedText: false,
      priority: 5,
      description: 'Extracts articles and images from Hespress.com'
    });
  }

  private async fetchArticleHtml(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    if (!response.ok) throw new Error(`Failed to fetch article: ${response.statusText}`);
    return await response.text();
  }

  private cleanHtmlContent(html: string): string {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const articleContent = document.querySelector('.article-content');

    if (!articleContent) return '';

    articleContent.querySelectorAll('script, style, iframe, noscript, .ad, [class*="ad-"]').forEach(el => el.remove());

    let content = articleContent.innerHTML
      .replace(/<\/p>/g, '\n\n')
      .replace(/<\/div>/g, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/[\s\u00A0]+/g, ' ')
      .trim();

    return content;
  }

  private extractImageInfoFromMeta(document: Document): {
    imageBlocks: ImageBlock[];
    assets: ContentDocument['assets'];
  } {
    const imageBlocks: ImageBlock[] = [];
    const assets: ContentDocument['assets'] = {};

    const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
    const ogImageType = document.querySelector('meta[property="og:image:type"]')?.getAttribute('content') || 'image/jpeg';
    const ogImageWidth = document.querySelector('meta[property="og:image:width"]')?.getAttribute('content');
    const ogImageHeight = document.querySelector('meta[property="og:image:height"]')?.getAttribute('content');
    const alt = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || 'Cover image';

    if (ogImage) {
      const assetId = uuidv4();

      assets[assetId] = {
        format: ogImageType,
        originalSrc: ogImage,
        width: ogImageWidth ? parseInt(ogImageWidth) : undefined,
        height: ogImageHeight ? parseInt(ogImageHeight) : undefined
      };

      imageBlocks.push({
        id: 'img-1',
        type: 'image',
        assetId,
        alt: alt,
        order: 2
      });
    }

    return { imageBlocks, assets };
  }

  private async processUrl(url: string): Promise<ContentAdapterResult> {
    const html = await this.fetchArticleHtml(url);
    const baseUrl = new URL(url).origin;
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const textContent = this.cleanHtmlContent(html);
    const { imageBlocks, assets } = this.extractImageInfoFromMeta(document);

    const contentBlocks: (TextBlock | ImageBlock)[] = [];

    if (textContent) {
      contentBlocks.push({
        id: 'text-main',
        type: 'text',
        order: 1,
        content: textContent
      });
    }

    imageBlocks.forEach((img, index) => {
      img.order = contentBlocks.length + 1;
      img.id = `img-${index + 1}`;
      contentBlocks.push(img);
    });

    // Metadata
    const title =
      document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
      document.querySelector('title')?.textContent?.trim() ||
      'Hespress Article';

    const author =
      document.querySelector('meta[name="author"]')?.getAttribute('content') ||
      document.querySelector('.author')?.textContent?.trim() ||
      'Unknown Author';

    const summary =
      document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';

    const language =
      document.documentElement.lang ||
      document.querySelector('meta[property="og:locale"]')?.getAttribute('content')?.split('_')[0] ||
      'en';

    const publishedDate =
      document.querySelector('meta[property="article:published_time"]')?.getAttribute('content') ||
      new Date().toISOString();

    const mediaUuid = uuidv4();

    const contentDocument: ContentDocument = {
      version: '1.0.0',
      metadata: {
        title,
        language
      },
      assets,
      contentBlocks
    };

    const mediaDir = path.join(process.cwd(), 'library', mediaUuid);
    await fs.mkdir(mediaDir, { recursive: true });
    await fs.writeFile(path.join(mediaDir, 'document.json'), JSON.stringify(contentDocument, null, 2));

    return {
      libraryItemData: {
        name: title,
        type: 'article',
        sourceUri: url,
        dynamicMetadata: {
          source: 'Hespress',
          sourceUrl: url,
          author,
          description: summary,
          publishedAt: publishedDate,
          id: mediaUuid,
          importedAt: new Date().toISOString(),
          lastAccessed: new Date().toISOString(),
          imageCount: imageBlocks.length
        }
      },
      contentDocument
    };
  }

  adapt: ContentAdapterFunction = async (source, _context) => {
    if (typeof source === 'string') {
      return this.processUrl(source);
    }
    throw new Error('Hespress adapter only supports string URLs');
  };
}

export const createHespressAdapter = (): HespressAdapter => new HespressAdapter();
