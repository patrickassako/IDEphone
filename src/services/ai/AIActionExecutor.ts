/**
 * AI Action Executor
 * Executes actions suggested by AI (modify files, create files, etc.)
 */

import { AIAction, CodeBlock } from './types';
import * as FileSystem from 'expo-file-system';

export interface EditorReference {
  /**
   * Get current content from editor
   */
  getContent: () => Promise<string>;

  /**
   * Set content in editor
   */
  setContent: (content: string) => Promise<void>;

  /**
   * Replace selected text
   */
  replaceSelection: (text: string) => Promise<void>;

  /**
   * Insert text at cursor position
   */
  insertAtCursor: (text: string) => Promise<void>;

  /**
   * Replace specific line range
   */
  replaceRange: (startLine: number, endLine: number, text: string) => Promise<void>;
}

export class AIActionExecutor {
  /**
   * Apply a code block to the editor
   */
  static async applyCodeBlock(
    codeBlock: CodeBlock,
    editorRef: EditorReference,
    replaceAll: boolean = false
  ): Promise<void> {
    if (replaceAll) {
      // Replace entire file content
      await editorRef.setContent(codeBlock.code);
    } else if (codeBlock.startLine !== undefined && codeBlock.endLine !== undefined) {
      // Replace specific line range
      await editorRef.replaceRange(codeBlock.startLine, codeBlock.endLine, codeBlock.code);
    } else {
      // Replace selection or insert at cursor
      try {
        await editorRef.replaceSelection(codeBlock.code);
      } catch {
        // If no selection, insert at cursor
        await editorRef.insertAtCursor(codeBlock.code);
      }
    }
  }

  /**
   * Execute an AI action
   */
  static async executeAction(action: AIAction, editorRef?: EditorReference): Promise<void> {
    switch (action.type) {
      case 'replace_selection':
        if (!editorRef) throw new Error('Editor reference required');
        await editorRef.replaceSelection(action.content || '');
        break;

      case 'replace_range':
        if (!editorRef) throw new Error('Editor reference required');
        if (action.startLine === undefined || action.endLine === undefined) {
          throw new Error('Start and end line required for replace_range');
        }
        await editorRef.replaceRange(action.startLine, action.endLine, action.content || '');
        break;

      case 'insert_at_cursor':
        if (!editorRef) throw new Error('Editor reference required');
        await editorRef.insertAtCursor(action.content || '');
        break;

      case 'create_file':
        if (!action.filePath || !action.content) {
          throw new Error('File path and content required for create_file');
        }
        await this.createFile(action.filePath, action.content);
        break;

      case 'modify_file':
        if (!action.filePath || !action.content) {
          throw new Error('File path and content required for modify_file');
        }
        await this.modifyFile(action.filePath, action.content);
        break;

      case 'delete_file':
        if (!action.filePath) {
          throw new Error('File path required for delete_file');
        }
        await this.deleteFile(action.filePath);
        break;

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Create a new file
   */
  private static async createFile(filePath: string, content: string): Promise<void> {
    // Ensure directory exists
    const directory = filePath.substring(0, filePath.lastIndexOf('/'));
    const dirInfo = await FileSystem.getInfoAsync(directory);

    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    }

    // Create file
    await FileSystem.writeAsStringAsync(filePath, content);
  }

  /**
   * Modify existing file
   */
  private static async modifyFile(filePath: string, content: string): Promise<void> {
    await FileSystem.writeAsStringAsync(filePath, content);
  }

  /**
   * Delete file
   */
  private static async deleteFile(filePath: string): Promise<void> {
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(filePath);
    }
  }

  /**
   * Smart replace: try to find the best match in the file and replace
   */
  static async smartReplace(
    currentContent: string,
    oldCode: string,
    newCode: string
  ): Promise<string> {
    // First try exact match
    if (currentContent.includes(oldCode)) {
      return currentContent.replace(oldCode, newCode);
    }

    // Try fuzzy match (ignoring whitespace differences)
    const normalizedOld = oldCode.replace(/\s+/g, ' ').trim();
    const normalizedContent = currentContent.replace(/\s+/g, ' ');

    if (normalizedContent.includes(normalizedOld)) {
      // Find position and replace with proper formatting
      const startIndex = normalizedContent.indexOf(normalizedOld);
      const endIndex = startIndex + normalizedOld.length;

      // Map back to original indices (approximate)
      let realStart = 0;
      let normalizedCount = 0;

      for (let i = 0; i < currentContent.length; i++) {
        if (!currentContent[i].match(/\s/)) {
          normalizedCount++;
        }
        if (normalizedCount >= startIndex) {
          realStart = i;
          break;
        }
      }

      // Replace
      return currentContent.substring(0, realStart) + newCode + currentContent.substring(endIndex);
    }

    // If no match found, return original content
    // In a real scenario, you might want to throw an error or show a diff
    throw new Error('Could not find code to replace. Please select the code manually.');
  }

  /**
   * Parse AI response for code blocks and suggested actions
   */
  static parseAIResponse(content: string): {
    codeBlocks: CodeBlock[];
    explanation: string;
  } {
    const codeBlocks: CodeBlock[] = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    let explanation = content;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      codeBlocks.push({
        language: match[1] || 'plaintext',
        code: match[2].trim(),
      });

      // Remove code block from explanation
      explanation = explanation.replace(match[0], '').trim();
    }

    return { codeBlocks, explanation };
  }
}
