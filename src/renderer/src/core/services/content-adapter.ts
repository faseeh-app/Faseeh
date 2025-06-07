
import {  ContentAdapterFunction, ContentAdapterInfo } from "@root/src/shared/types/content-adapter-types";


export abstract class ContentAdapter {


  private readonly info : ContentAdapterInfo;


  constructor(info: ContentAdapterInfo) {
    this.info = info;
  }
  public getInfo(): ContentAdapterInfo {
    return this.info;
  }






  abstract adapt: ContentAdapterFunction;


}
