import {
  MetadataScraperRegistration,
  MetadataScraperInfo,
  MetadataScraperResult,
  MetadataScraperFunction,
  MetadataScraperSource,
  IMetadataScraperRegistry,
  MetadataScraperFindCriteria,
  FaseehApp
} from '@shared/types/types'

const { extname } = require('path')

/**
 * Implementation of the Metadata Scraper Registry system.
 *
 * This class manages a collection of metadata scrapers that can extract metadata from various
 * sources including URLs, local files, and File objects. It uses a sophisticated scoring system
 * to automatically select the most appropriate scraper for each source.
 *
 * The registry supports both class-based and functional scraper implementations, allowing for
 * flexible plugin architectures and easy extensibility.
 *
 * @example
 * ```typescript
 * const registry = new MetadataScraperRegistry(app)
 *
 * // Register a scraper
 * registry.register(youtubeScraper)
 *
 * // Scrape metadata
 * const result = await registry.scrapeMetadata('https://youtube.com/watch?v=example')
 * if (result.success) {
 *   console.log('Extracted metadata:', result.metadata)
 * }
 * ```
 *
 * @public
 */
export class MetadataScraperRegistry implements IMetadataScraperRegistry {
  /**
   * Internal map storing registered scrapers by their unique identifiers.
   * @private
   */
  private scrapers: Map<string, MetadataScraperRegistration> = new Map()

  /**
   * Reference to the Faseeh application instance for accessing storage and plugins.
   * @private
   */
  private app: FaseehApp

  /**
   * Creates a new MetadataScraperRegistry instance.
   *
   * @param app - Faseeh application instance providing access to storage and plugins
   */
  constructor() {
    this.app = {} as FaseehApp
    /* FIXME: the whole app context passing needs to be refactored
     * The setApp method is just a temporary solution
     * what should be done is to create another context/service/utilty class that will be passed
     * to FaseehApp and then to the registry, that way we can avoid circular dependencies or at least that's the plan
     */
  }

  setApp(app: FaseehApp): void {
    this.app = app
  }

  /**
   * @inheritdoc
   */
  register(registration: MetadataScraperRegistration): void {
    if (this.scrapers.has(registration.id)) {
      throw new Error(`Metadata scraper with id ${registration.id} is already registered.`)
    }

    this.scrapers.set(registration.id, registration)
  }

  /**
   * @inheritdoc
   */
  unregister(id: string): void {
    if (!this.scrapers.has(id)) {
      throw new Error(`Metadata scraper with id ${id} is not registered.`)
    }

    this.scrapers.delete(id)
  }

  /**
   * @inheritdoc
   */
  findBestScraper(criteria: MetadataScraperFindCriteria): MetadataScraperRegistration | null {
    let bestScraper: MetadataScraperRegistration | null = null
    let highestScore = 0
    let highestPriority = -Infinity

    for (const registration of this.scrapers.values()) {
      const scraperInfo: MetadataScraperInfo = registration
      let score = 0

      if (criteria.mimeType && scraperInfo.supportedMimeTypes.includes(criteria.mimeType)) {
        score += 3
      }

      if (
        criteria.fileExtension &&
        scraperInfo.supportedExtensions.includes(criteria.fileExtension)
      ) {
        score += 3
      }

      if (criteria.sourceUrl && scraperInfo.urlPatterns?.length) {
        for (const pattern of scraperInfo.urlPatterns) {
          try {
            const regex = new RegExp(pattern)
            if (regex.test(criteria.sourceUrl)) {
              score += 2
              break
            }
          } catch (e) {
            console.error(`Invalid regex pattern "${pattern}" in scraper ${scraperInfo.id}:`, e)
            continue
          }
        }
      }

      if (criteria.isLocalFile && scraperInfo.canHandleLocalFiles) {
        score += 2
      }

      if (criteria.sourceUrl && scraperInfo.canHandleUrls) {
        score += 2
      }

      if (score === 0) continue

      const priority = scraperInfo.priority ?? 0

      if (score > highestScore || (score === highestScore && priority > highestPriority)) {
        bestScraper = registration
        highestScore = score
        highestPriority = priority
      }
    }
    return bestScraper
  }

  /**
   * @inheritdoc
   */
  getScraperById(id: string): MetadataScraperRegistration | null {
    return this.scrapers.get(id) ?? null
  }

  /**
   * @inheritdoc
   */
  listRegisteredScrapers(): MetadataScraperRegistration[] {
    return Array.from(this.scrapers.values())
  }
  /**
   * Converts a source and optional context into criteria for scraper selection.
   *
   * This method analyzes the provided source to determine its characteristics such as:
   * - MIME type and file extension (for File objects)
   * - URL patterns and file extensions (for URL strings)
   * - Local file paths and extensions (for file path strings)
   *
   * The generated criteria are then used by `findBestScraper` to locate the most
   * appropriate scraper for the given source.
   *
   * @param source - The source to analyze (URL string, file path string, or File object)
   * @param context - Optional context information to supplement source analysis
   * @param context.originalPath - Original file path when source has been processed/transformed
   * @param context.sourceUrl - Explicit URL when source type is ambiguous
   * @returns Promise resolving to criteria object used for scraper selection
   * @private
   */
  private async sourceToCriteria(
    source: MetadataScraperSource,
    context?: {
      originalPath?: string
      sourceUrl?: string
    }
  ): Promise<MetadataScraperFindCriteria> {
    const criteria: MetadataScraperFindCriteria = { source }

    await this.handleSourceType(source, criteria)
    this.applyContextInformation(criteria, context)

    return criteria
  }

  /**
   * Dispatches source analysis to appropriate handler based on source type.
   *
   * This method determines the type of the source (string vs File object) and
   * delegates to the appropriate specialized handler method for detailed analysis.
   *
   * @param source - The source to analyze
   * @param criteria - Criteria object to populate with source characteristics
   * @private
   */
  private async handleSourceType(
    source: MetadataScraperSource,
    criteria: MetadataScraperFindCriteria
  ): Promise<void> {
    if (typeof source === 'string') {
      this.handleStringSource(source, criteria)
    } else if (source instanceof File) {
      this.handleFileSource(source, criteria)
    }
  }

  /**
   * Analyzes string sources to determine if they are URLs or file paths.
   *
   * For URL strings:
   * - Extracts the full URL for pattern matching
   * - Attempts to determine file extension from URL pathname
   *
   * For file path strings:
   * - Marks the source as a local file
   * - Extracts file extension from the path
   *
   * @param source - String source (URL or file path)
   * @param criteria - Criteria object to populate with extracted information
   * @private
   */
  private handleStringSource(source: string, criteria: MetadataScraperFindCriteria): void {
    try {
      const url = new URL(source)
      criteria.sourceUrl = url.href
      const ext = extname(url.pathname).toLowerCase()
      criteria.fileExtension = ext ? ext.slice(1) : undefined
    } catch {
      // If not a valid URL, treat as local file path
      criteria.isLocalFile = true
      const ext = extname(source).toLowerCase()
      criteria.fileExtension = ext ? ext.slice(1) : undefined
    }
  }

  /**
   * Extracts metadata from File objects for scraper selection.
   *
   * File objects provide rich metadata that can be used for precise scraper matching:
   * - MIME type from the File.type property
   * - File extension extracted from the filename
   * - Automatic classification as local file
   *
   * @param file - File object to analyze
   * @param criteria - Criteria object to populate with file characteristics
   * @private
   */
  private handleFileSource(file: File, criteria: MetadataScraperFindCriteria): void {
    criteria.mimeType = file.type || undefined
    criteria.fileExtension = extname(file.name).slice(1).toLowerCase()
    criteria.isLocalFile = true
  }

  /**
   * Applies additional context information to supplement source analysis.
   *
   * Context information can provide missing details when the source itself
   * doesn't contain sufficient information for scraper selection:
   * - File extension from original path when not derivable from source
   * - Explicit source URL when source type is ambiguous
   *
   * This method only applies context values when the corresponding criteria
   * fields are not already populated, ensuring source-derived information
   * takes precedence over context hints.
   *
   * @param criteria - Criteria object to enhance with context information
   * @param context - Optional context providing additional hints
   * @private
   */
  private applyContextInformation(
    criteria: MetadataScraperFindCriteria,
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

  /**
   * Invokes the appropriate scraper method based on registration type.
   *
   * This method handles both class-based and functional scraper implementations:
   *
   * For class-based scrapers:
   * - Instantiates the scraper class with registration info
   * - Binds the scrape method to the instance
   *
   * For functional scrapers:
   * - Uses the scraper function directly
   *
   * The method ensures consistent invocation regardless of implementation approach
   * and provides proper error handling for invalid registrations.
   *
   * @param registration - Scraper registration containing implementation details
   * @param source - Source data to pass to the scraper
   * @param context - Context object with app instance and additional information
   * @returns Promise resolving to extracted metadata
   * @throws {Error} When registration contains neither class nor function implementation
   * @private
   */
  private async invokeScraperMethod(
    registration: MetadataScraperRegistration,
    source: MetadataScraperSource,
    context: {
      app: FaseehApp
      originalPath?: string
      sourceUrl?: string
    }
  ): Promise<MetadataScraperResult> {
    let scrapeFn: MetadataScraperFunction
    if (registration.scraperClass) {
      const scraperInstance = new registration.scraperClass(registration)
      scrapeFn = scraperInstance.scrape.bind(scraperInstance)
    } else if (registration.scraper) {
      scrapeFn = registration.scraper
    } else {
      console.error('no scraper function found for registration', registration)
      return Promise.reject(new Error('No scraper function found for registration'))
    }
    return scrapeFn(source, context)
  }

  /**
   * @inheritdoc
   */
  async scrapeMetadata(
    source: MetadataScraperSource,
    context?: {
      originalPath?: string
      sourceUrl?: string
    }
  ): Promise<{
    success: boolean
    metadata?: MetadataScraperResult
    error?: string
  }> {
    const criteria = await this.sourceToCriteria(source, context)
    const scraper = this.findBestScraper(criteria)

    if (!scraper) {
      return {
        success: false,
        error: 'No suitable metadata scraper found for the provided source.'
      }
    }

    try {
      const result = await this.invokeScraperMethod(scraper, source, {
        app: this.app,
        originalPath: context?.originalPath,
        sourceUrl: context?.sourceUrl
      })

      return {
        success: true,
        metadata: result
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error scraping metadata'
      }
    }
  }
}
