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

export interface ProjectDeployment {
  projectPath: string;
  deploymentId: string;
  url: string;
  status: 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED' | 'QUEUED';
  buildUrl?: string;
  inspectorUrl?: string;
  deployedAt: number;
  lastChecked?: number;
}

export interface ProjectMetadata {
  name: string;
  path: string;
  createdAt: number;
  updatedAt: number;
  deployment?: ProjectDeployment;
  framework?: string;
  language?: string;
}

export interface BuildLog {
  timestamp: number;
  message: string;
  type: 'info' | 'error' | 'warning' | 'success';
}

export interface ProjectValidationError {
  file: string;
  line?: number;
  message: string;
  severity: 'error' | 'warning';
  suggestedFix?: string;
}
