export enum FileStatus {
  Active = 'active',
  Archived = 'archived',
  Deleted = 'deleted',
}

export interface MarkdownFile {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  status: FileStatus;
  excerpt?: string;
  pinned?: boolean;
  hasCustomTitle?: boolean;
  /** Timestamp (ms) en que fue enviado a la papelera. Usado para calcular el vencimiento de 5 dias. */
  deletedAt?: number;
}
