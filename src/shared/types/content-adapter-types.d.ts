import { FaseehApp } from './../../renderer/src/core/plugins/plugin-types.d';
export type ContentAdapterSource = string | Buffer | File;
import { LibraryItem } from '@root/src/main/db/types';
import { ContentDocument } from './content-document';

export interface AssetDetail {
  format : string ;
  content : Buffer | string ;
}


export interface DocumentAssets {
  [assetId: string] : AssetDetail;
}



export interface ContentAdapterResult {
  libraryItemData : Partial<LibraryItem>;
  contentDocument? : ContentDocument;

  documentAssets?: DocumentAssets;


  associatedFiles?: {
    type : string ;
    format? : string ;
    language? : string ;
    filename?: string ;
    content: string | Buffer ;
  }[];






}


// _______________ Adapter Definition types _______________


export type ContentAdapterFunction = (
  source : ContentAdapterSource,
  context : {
    app : Pick< FaseehApp , 'storage' | 'plugins' > ;
    originalPath? : string ;
    libraryItemId? : string | null ;


  }
) => Promise< ContentAdapterResult> ;




export interface ContentAdapterInfo {


  id : string ;
  name : string ;
  supportedMimeTypes : string[];

  supportedExtensions : string[];

  urlPatterns?: string[] | RegExp[];
  canHandlePastedText?: boolean;

  priority ?: number;

  description?: string;

}


export interface ContentAdapterRegistration {
  adapt : ContentAdapterFunction;




}




