/**
 * AI Service Types and Interfaces
 * Core types for AI integration in IDEphone
 */

export type AIProviderType = 'claude' | 'openai' | 'gemini';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIContext {
  // Current file information
  filePath?: string;
  fileName?: string;
  language?: string;
  fileContent?: string;

  // Selection information
  selectedText?: string;
  selectionStart?: number;
  selectionEnd?: number;

  // Project context
  projectName?: string;
  packageJson?: any;
  dependencies?: string[];

  // Conversation history
  messages?: AIMessage[];
}

export interface AIResponse {
  content: string;
  codeBlocks?: CodeBlock[];
  actions?: AIAction[];
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalCost?: number;
  };
}

export interface CodeBlock {
  language: string;
  code: string;
  fileName?: string;
  startLine?: number;
  endLine?: number;
}

export type AIActionType =
  | 'replace_selection'
  | 'replace_range'
  | 'insert_at_cursor'
  | 'create_file'
  | 'modify_file'
  | 'delete_file';

export interface AIAction {
  type: AIActionType;
  filePath?: string;
  content?: string;
  startLine?: number;
  endLine?: number;
  description?: string;
}

export interface AIConfig {
  provider: AIProviderType;
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  streaming?: boolean;
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

export type StreamCallback = (chunk: StreamChunk) => void;
