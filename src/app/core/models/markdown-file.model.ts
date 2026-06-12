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
}
