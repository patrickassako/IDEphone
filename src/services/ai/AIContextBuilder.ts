/**
 * AI Context Builder
 * Builds context for AI requests from current editor state and project
 */

import { AIContext } from './types';
import * as FileSystem from 'expo-file-system';

export class AIContextBuilder {
  /**
   * Build context from current file and selection
   */
  static async buildFromFile(
    filePath: string,
    fileContent: string,
    selectedText?: string,
    selectionStart?: number,
    selectionEnd?: number
  ): Promise<AIContext> {
    const fileName = filePath.split('/').pop() || '';
    const language = this.detectLanguage(fileName);

    const context: AIContext = {
      filePath,
      fileName,
      language,
      fileContent,
      selectedText,
      selectionStart,
      selectionEnd,
    };

    // Try to load package.json for additional context
    try {
      const projectRoot = this.findProjectRoot(filePath);
      if (projectRoot) {
        const packageJsonPath = `${projectRoot}/package.json`;
        const packageJsonExists = await FileSystem.getInfoAsync(packageJsonPath);

        if (packageJsonExists.exists) {
          const packageJsonContent = await FileSystem.readAsStringAsync(packageJsonPath);
          context.packageJson = JSON.parse(packageJsonContent);
          context.projectName = context.packageJson.name;
          context.dependencies = [
            ...Object.keys(context.packageJson.dependencies || {}),
            ...Object.keys(context.packageJson.devDependencies || {}),
          ];
        }
      }
    } catch (error) {
      // Ignore errors - package.json is optional context
      console.log('Could not load package.json:', error);
    }

    return context;
  }

  /**
   * Build minimal context (for quick requests)
   */
  static buildMinimal(
    fileName: string,
    fileContent: string,
    selectedText?: string
  ): AIContext {
    return {
      fileName,
      language: this.detectLanguage(fileName),
      fileContent,
      selectedText,
    };
  }

  /**
   * Detect programming language from file extension
   */
  private static detectLanguage(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();

    const languageMap: { [key: string]: string } = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      java: 'java',
      kt: 'kotlin',
      swift: 'swift',
      cpp: 'cpp',
      c: 'c',
      h: 'c',
      hpp: 'cpp',
      cs: 'csharp',
      go: 'go',
      rs: 'rust',
      rb: 'ruby',
      php: 'php',
      html: 'html',
      css: 'css',
      scss: 'scss',
      json: 'json',
      md: 'markdown',
      yaml: 'yaml',
      yml: 'yaml',
      xml: 'xml',
      sql: 'sql',
      sh: 'bash',
      dart: 'dart',
    };

    return languageMap[ext || ''] || 'plaintext';
  }

  /**
   * Find project root by looking for package.json, .git, etc.
   */
  private static findProjectRoot(filePath: string): string | null {
    const parts = filePath.split('/');

    // Look for common project root indicators
    // Typically in mobile: /data/user/0/com.app/files/repositories/reponame/
    // Or: /storage/emulated/0/IDEphone/repositories/reponame/

    const repoIndex = parts.findIndex(part => part === 'repositories');
    if (repoIndex !== -1 && parts.length > repoIndex + 1) {
      // Return path up to and including the repo name
      return parts.slice(0, repoIndex + 2).join('/');
    }

    return null;
  }

  /**
   * Format context for AI prompt (human-readable)
   */
  static formatContextForPrompt(context: AIContext): string {
    let formatted = '';

    if (context.fileName) {
      formatted += `File: ${context.fileName}\n`;
    }

    if (context.language) {
      formatted += `Language: ${context.language}\n`;
    }

    if (context.projectName) {
      formatted += `Project: ${context.projectName}\n`;
    }

    formatted += '\n';

    if (context.selectedText) {
      formatted += `Selected code:\n\`\`\`${context.language}\n${context.selectedText}\n\`\`\`\n\n`;
    } else if (context.fileContent) {
      formatted += `Full file content:\n\`\`\`${context.language}\n${context.fileContent}\n\`\`\`\n\n`;
    }

    return formatted;
  }
}
