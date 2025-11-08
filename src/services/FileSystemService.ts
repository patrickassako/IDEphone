import * as FileSystem from 'expo-file-system/legacy';
import { FileItem } from '../types';

export class FileSystemService {
  private static baseDir = FileSystem.documentDirectory + 'projects/';

  static async initialize(): Promise<void> {
    const info = await FileSystem.getInfoAsync(this.baseDir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(this.baseDir, { intermediates: true });
    }
  }

  static async readDirectory(path: string): Promise<FileItem[]> {
    try {
      const fullPath = path.startsWith(this.baseDir) ? path : this.baseDir + path;
      const items = await FileSystem.readDirectoryAsync(fullPath);

      const fileItems: FileItem[] = await Promise.all(
        items.map(async (item) => {
          const itemPath = fullPath + (fullPath.endsWith('/') ? '' : '/') + item;
          const info = await FileSystem.getInfoAsync(itemPath);

          return {
            name: item,
            path: itemPath,
            type: info.isDirectory ? 'directory' : 'file',
            size: info.size,
            modifiedTime: info.modificationTime,
            isExpanded: false,
            children: info.isDirectory ? [] : undefined,
          };
        })
      );

      return fileItems.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'directory' ? -1 : 1;
      });
    } catch (error) {
      console.error('Error reading directory:', error);
      return [];
    }
  }

  static async readFile(path: string): Promise<string> {
    try {
      return await FileSystem.readAsStringAsync(path);
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  }

  static async writeFile(path: string, content: string): Promise<void> {
    try {
      await FileSystem.writeAsStringAsync(path, content);
    } catch (error) {
      console.error('Error writing file:', error);
      throw error;
    }
  }

  static async createFile(dirPath: string, fileName: string): Promise<string> {
    const fullPath = dirPath + (dirPath.endsWith('/') ? '' : '/') + fileName;
    await FileSystem.writeAsStringAsync(fullPath, '');
    return fullPath;
  }

  static async createDirectory(dirPath: string, dirName: string): Promise<string> {
    const fullPath = dirPath + (dirPath.endsWith('/') ? '' : '/') + dirName;
    await FileSystem.makeDirectoryAsync(fullPath, { intermediates: true });
    return fullPath;
  }

  static async deleteItem(path: string): Promise<void> {
    try {
      await FileSystem.deleteAsync(path, { idempotent: true });
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  }

  static async renameItem(oldPath: string, newName: string): Promise<string> {
    const dirPath = oldPath.substring(0, oldPath.lastIndexOf('/'));
    const newPath = dirPath + '/' + newName;

    try {
      await FileSystem.moveAsync({
        from: oldPath,
        to: newPath,
      });
      return newPath;
    } catch (error) {
      console.error('Error renaming item:', error);
      throw error;
    }
  }

  static async copyItem(sourcePath: string, destPath: string): Promise<void> {
    try {
      await FileSystem.copyAsync({
        from: sourcePath,
        to: destPath,
      });
    } catch (error) {
      console.error('Error copying item:', error);
      throw error;
    }
  }

  static getLanguageFromFileName(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      php: 'php',
      rb: 'ruby',
      go: 'go',
      rs: 'rust',
      kt: 'kotlin',
      swift: 'swift',
      dart: 'dart',
      html: 'html',
      css: 'css',
      scss: 'scss',
      json: 'json',
      xml: 'xml',
      md: 'markdown',
      sh: 'bash',
      yml: 'yaml',
      yaml: 'yaml',
      sql: 'sql',
    };
    return languageMap[ext || ''] || 'text';
  }

  static getBaseDir(): string {
    return this.baseDir;
  }

  static async exists(path: string): Promise<boolean> {
    try {
      const info = await FileSystem.getInfoAsync(path);
      return info.exists;
    } catch (error) {
      return false;
    }
  }
}
