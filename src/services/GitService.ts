import git from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import * as FileSystem from 'expo-file-system/legacy';
import { GitStatus, GitConfig } from '../types';

// Custom FS implementation for isomorphic-git using expo-file-system
const fs = {
  promises: {
    async readFile(filepath: string, options?: any): Promise<string | Uint8Array> {
      const encoding = options?.encoding || 'utf8';
      if (encoding === 'utf8') {
        return await FileSystem.readAsStringAsync(filepath);
      }
      const base64 = await FileSystem.readAsStringAsync(filepath, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    },

    async writeFile(filepath: string, data: string | Uint8Array): Promise<void> {
      if (typeof data === 'string') {
        await FileSystem.writeAsStringAsync(filepath, data);
      } else {
        const base64 = btoa(String.fromCharCode(...Array.from(data)));
        await FileSystem.writeAsStringAsync(filepath, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }
    },

    async unlink(filepath: string): Promise<void> {
      await FileSystem.deleteAsync(filepath, { idempotent: true });
    },

    async readdir(filepath: string): Promise<string[]> {
      return await FileSystem.readDirectoryAsync(filepath);
    },

    async mkdir(filepath: string): Promise<void> {
      await FileSystem.makeDirectoryAsync(filepath, { intermediates: true });
    },

    async rmdir(filepath: string): Promise<void> {
      await FileSystem.deleteAsync(filepath, { idempotent: true });
    },

    async stat(filepath: string): Promise<any> {
      const info = await FileSystem.getInfoAsync(filepath);
      return {
        isFile: () => !info.isDirectory,
        isDirectory: () => info.isDirectory,
        isSymbolicLink: () => false,
        size: info.size,
        mode: 0o666,
        mtimeMs: info.modificationTime,
      };
    },

    async lstat(filepath: string): Promise<any> {
      return this.stat(filepath);
    },

    async readlink(filepath: string): Promise<string> {
      throw new Error('Symlinks not supported');
    },

    async symlink(target: string, filepath: string): Promise<void> {
      throw new Error('Symlinks not supported');
    },

    async chmod(filepath: string, mode: number): Promise<void> {
      // Not supported on mobile
    },
  },
};

export class GitService {
  private static config: GitConfig = {
    name: 'IDEphone User',
    email: 'user@idephone.app',
  };

  static setConfig(config: GitConfig): void {
    this.config = config;
  }

  static async init(dir: string): Promise<void> {
    try {
      await git.init({ fs, dir });
    } catch (error) {
      console.error('Error initializing git:', error);
      throw error;
    }
  }

  static async clone(url: string, dir: string, depth?: number): Promise<void> {
    try {
      await git.clone({
        fs,
        http,
        dir,
        url,
        depth: depth || 1,
        singleBranch: true,
        corsProxy: 'https://cors.isomorphic-git.org',
      });
    } catch (error) {
      console.error('Error cloning repository:', error);
      throw error;
    }
  }

  static async status(dir: string, filepath?: string): Promise<string> {
    try {
      if (filepath) {
        return await git.status({ fs, dir, filepath });
      }
      const status = await git.statusMatrix({ fs, dir });
      return JSON.stringify(status);
    } catch (error) {
      console.error('Error getting status:', error);
      throw error;
    }
  }

  static async add(dir: string, filepath: string): Promise<void> {
    try {
      await git.add({ fs, dir, filepath });
    } catch (error) {
      console.error('Error adding file:', error);
      throw error;
    }
  }

  static async addAll(dir: string): Promise<void> {
    try {
      await git.add({ fs, dir, filepath: '.' });
    } catch (error) {
      console.error('Error adding all files:', error);
      throw error;
    }
  }

  static async commit(dir: string, message: string): Promise<string> {
    try {
      const sha = await git.commit({
        fs,
        dir,
        message,
        author: {
          name: this.config.name,
          email: this.config.email,
        },
      });
      return sha;
    } catch (error) {
      console.error('Error committing:', error);
      throw error;
    }
  }

  static async push(dir: string, remote: string = 'origin', branch: string = 'main'): Promise<void> {
    try {
      await git.push({
        fs,
        http,
        dir,
        remote,
        ref: branch,
        corsProxy: 'https://cors.isomorphic-git.org',
      });
    } catch (error) {
      console.error('Error pushing:', error);
      throw error;
    }
  }

  static async pull(dir: string, remote: string = 'origin', branch: string = 'main'): Promise<void> {
    try {
      await git.pull({
        fs,
        http,
        dir,
        ref: branch,
        singleBranch: true,
        corsProxy: 'https://cors.isomorphic-git.org',
        author: {
          name: this.config.name,
          email: this.config.email,
        },
      });
    } catch (error) {
      console.error('Error pulling:', error);
      throw error;
    }
  }

  static async getBranch(dir: string): Promise<string> {
    try {
      return await git.currentBranch({ fs, dir }) || 'main';
    } catch (error) {
      console.error('Error getting branch:', error);
      return 'unknown';
    }
  }

  static async listBranches(dir: string): Promise<string[]> {
    try {
      return await git.listBranches({ fs, dir });
    } catch (error) {
      console.error('Error listing branches:', error);
      return [];
    }
  }

  static async checkout(dir: string, ref: string): Promise<void> {
    try {
      await git.checkout({ fs, dir, ref });
    } catch (error) {
      console.error('Error checking out:', error);
      throw error;
    }
  }

  static async createBranch(dir: string, branchName: string): Promise<void> {
    try {
      await git.branch({ fs, dir, ref: branchName });
    } catch (error) {
      console.error('Error creating branch:', error);
      throw error;
    }
  }

  static async log(dir: string, depth: number = 10): Promise<any[]> {
    try {
      return await git.log({ fs, dir, depth });
    } catch (error) {
      console.error('Error getting log:', error);
      return [];
    }
  }

  static async getChangedFiles(dir: string): Promise<GitStatus> {
    try {
      const branch = await this.getBranch(dir);
      const statusMatrix = await git.statusMatrix({ fs, dir });

      const staged: string[] = [];
      const unstaged: string[] = [];
      const untracked: string[] = [];

      statusMatrix.forEach(([filepath, headStatus, workdirStatus, stageStatus]) => {
        if (headStatus === 0 && workdirStatus === 2 && stageStatus === 0) {
          untracked.push(filepath);
        } else if (headStatus === 1 && workdirStatus === 2 && stageStatus === 1) {
          unstaged.push(filepath);
        } else if (stageStatus === 2) {
          staged.push(filepath);
        }
      });

      return {
        branch,
        hasChanges: staged.length > 0 || unstaged.length > 0 || untracked.length > 0,
        staged,
        unstaged,
        untracked,
      };
    } catch (error) {
      console.error('Error getting changed files:', error);
      return {
        branch: 'unknown',
        hasChanges: false,
        staged: [],
        unstaged: [],
        untracked: [],
      };
    }
  }
}
