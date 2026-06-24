export interface MarkdownImage {
  id: string;
  fileId: string;
  data: Blob;
  mimeType: string;
  name: string;
  createdAt: number;
}

export type ImageAlignment = 'left' | 'center' | 'right' | null;
