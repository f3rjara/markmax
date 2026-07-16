import { ImageAlignment } from '../../core/models/markdown-image.model';

export interface ImagePickResult {
  blob: Blob;
  mimeType: string;
  name: string;
  alt: string;
  alignment: ImageAlignment;
}

export interface ImageUrlResult {
  url: string;
  alt: string;
  alignment: ImageAlignment;
}
