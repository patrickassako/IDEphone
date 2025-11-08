/**
 * Multi-File Generator Service
 * Parses AI responses to extract multiple file generations
 * Supports various formats from AI responses
 */

export interface GeneratedFile {
  path: string;
  content: string;
  language?: string;
  action: 'create' | 'update';
}

export interface ParsedResponse {
  files: GeneratedFile[];
  summary?: string;
  hasMultipleFiles: boolean;
}

export class MultiFileGenerator {
  /**
   * Parse AI response and extract file structures
   * Supports multiple formats:
   * 1. Markdown with file paths: ```typescript:src/components/Button.tsx
   * 2. Explicit file blocks: File: src/components/Button.tsx
   * 3. XML-like tags: <file path="src/components/Button.tsx">
   */
  static parseResponse(aiResponse: string): ParsedResponse {
    const files: GeneratedFile[] = [];
    let summary = '';

    // Method 1: Extract markdown code blocks with file paths
    // Pattern: ```language:path/to/file.ext
    const markdownPattern = /```(\w+)?:([^\n]+)\n([\s\S]*?)```/g;
    let match;

    while ((match = markdownPattern.exec(aiResponse)) !== null) {
      const language = match[1] || this.inferLanguageFromPath(match[2]);
      const path = match[2].trim();
      const content = match[3].trim();

      files.push({
        path,
        content,
        language,
        action: 'create',
      });
    }

    // Method 2: Extract explicit "File:" declarations
    // Pattern: File: path/to/file.ext\n```language\n...```
    const fileBlockPattern = /File:\s*([^\n]+)\n```(\w+)?\n([\s\S]*?)```/g;

    while ((match = fileBlockPattern.exec(aiResponse)) !== null) {
      const path = match[1].trim();
      const language = match[2] || this.inferLanguageFromPath(path);
      const content = match[3].trim();

      // Avoid duplicates
      if (!files.some((f) => f.path === path)) {
        files.push({
          path,
          content,
          language,
          action: 'create',
        });
      }
    }

    // Method 3: Extract XML-like file tags
    // Pattern: <file path="...">...</file>
    const xmlPattern = /<file\s+path=["']([^"']+)["']>([\s\S]*?)<\/file>/g;

    while ((match = xmlPattern.exec(aiResponse)) !== null) {
      const path = match[1].trim();
      const content = match[2].trim();
      const language = this.inferLanguageFromPath(path);

      // Avoid duplicates
      if (!files.some((f) => f.path === path)) {
        files.push({
          path,
          content,
          language,
          action: 'create',
        });
      }
    }

    // Extract summary (first paragraph before code blocks)
    const summaryMatch = aiResponse.match(/^([\s\S]*?)(?:```|File:|<file)/);
    if (summaryMatch && summaryMatch[1].trim().length > 0) {
      summary = summaryMatch[1].trim();
    }

    return {
      files,
      summary,
      hasMultipleFiles: files.length > 1,
    };
  }

  /**
   * Infer programming language from file path
   */
  private static inferLanguageFromPath(path: string): string {
    const extension = path.split('.').pop()?.toLowerCase();

    const languageMap: { [key: string]: string } = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      go: 'go',
      rs: 'rust',
      rb: 'ruby',
      php: 'php',
      swift: 'swift',
      kt: 'kotlin',
      html: 'html',
      css: 'css',
      scss: 'scss',
      sass: 'sass',
      json: 'json',
      xml: 'xml',
      yaml: 'yaml',
      yml: 'yaml',
      md: 'markdown',
      sql: 'sql',
      sh: 'bash',
      bash: 'bash',
    };

    return languageMap[extension || ''] || 'plaintext';
  }

  /**
   * Validate file paths (basic security check)
   */
  static validateFilePath(path: string): { valid: boolean; error?: string } {
    // Check for path traversal attempts
    if (path.includes('..')) {
      return {
        valid: false,
        error: 'Path traversal detected. File paths cannot contain ".."',
      };
    }

    // Check for absolute paths (we want relative paths)
    if (path.startsWith('/')) {
      return {
        valid: false,
        error: 'Absolute paths not allowed. Use relative paths from project root.',
      };
    }

    // Check for empty path
    if (path.trim().length === 0) {
      return {
        valid: false,
        error: 'File path cannot be empty.',
      };
    }

    return { valid: true };
  }

  /**
   * Group files by directory for better organization
   */
  static groupFilesByDirectory(files: GeneratedFile[]): Map<string, GeneratedFile[]> {
    const grouped = new Map<string, GeneratedFile[]>();

    files.forEach((file) => {
      const directory = file.path.includes('/')
        ? file.path.substring(0, file.path.lastIndexOf('/'))
        : '.';

      if (!grouped.has(directory)) {
        grouped.set(directory, []);
      }

      grouped.get(directory)!.push(file);
    });

    return grouped;
  }

  /**
   * Get file statistics
   */
  static getFileStats(files: GeneratedFile[]): {
    totalFiles: number;
    totalLines: number;
    languages: string[];
    directories: string[];
  } {
    const languages = new Set<string>();
    const directories = new Set<string>();
    let totalLines = 0;

    files.forEach((file) => {
      if (file.language) {
        languages.add(file.language);
      }

      const dir = file.path.includes('/')
        ? file.path.substring(0, file.path.lastIndexOf('/'))
        : '.';
      directories.add(dir);

      totalLines += file.content.split('\n').length;
    });

    return {
      totalFiles: files.length,
      totalLines,
      languages: Array.from(languages),
      directories: Array.from(directories),
    };
  }
}
