import { MetadataScraperFunction, MetadataScraperInfo } from '@shared/types/types'

/**
 * Abstract class that provides the base functionality for metadata scrapers.
 * Implementations should define the specific scraping logic.
 * @abstract
 * @public
 */
export abstract class MetadataScraper {
  private readonly info: MetadataScraperInfo

  constructor(info: MetadataScraperInfo) {
    this.info = info
  }

  public getInfo(): MetadataScraperInfo {
    return this.info
  }

  abstract scrape: MetadataScraperFunction
}
