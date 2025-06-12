import { ContentAdapterFunction, ContentAdapterInfo } from '@shared/types/types'

/**
 * @public
 */
export abstract class ContentAdapter {
  private readonly info: ContentAdapterInfo

  constructor(info: ContentAdapterInfo) {
    this.info = info
  }
  public getInfo(): ContentAdapterInfo {
    return this.info
  }

  abstract adapt: ContentAdapterFunction
}
