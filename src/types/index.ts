export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modifiedTime?: number;
  isExpanded?: boolean;
  children?: FileItem[];
}

export interface TabItem {
  id: string;
  name: string;
  path: string;
  content: string;
  isDirty: boolean;
  language?: string;
}

export interface GitStatus {
  branch: string;
  hasChanges: boolean;
  staged: string[];
  unstaged: string[];
  untracked: string[];
}

export interface GitConfig {
  name: string;
  email: string;
}

export interface Repository {
  name: string;
  path: string;
  url?: string;
}
