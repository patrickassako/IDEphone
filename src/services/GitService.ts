import git from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import * as FileSystem from 'expo-file-system/legacy';
import JSZip from 'jszip';
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
  private static githubToken: string | null = null;

  static setConfig(config: GitConfig): void {
    this.config = config;
  }

  static setGitHubToken(token: string): void {
    this.githubToken = token;
  }

  static getGitHubToken(): string | null {
    return this.githubToken;
  }

  static async init(dir: string): Promise<void> {
    try {
      await git.init({ fs, dir });
    } catch (error) {
      console.error('Error initializing git:', error);
      throw error;
    }
  }

  /**
   * Clone a repository by downloading it as a ZIP file
   * This is more reliable on mobile than using git clone
   */
  static async cloneFromZip(
    owner: string,
    repo: string,
    dir: string,
    branch: string = 'main'
  ): Promise<void> {
    try {
      console.log(`Downloading ${owner}/${repo} from GitHub...`);

      // Construct the ZIP download URL
      const zipUrl = `https://api.github.com/repos/${owner}/${repo}/zipball/${branch}`;

      console.log('Download URL:', zipUrl);

      // Prepare headers with authentication if available
      const headers: any = {
        'Accept': 'application/vnd.github+json',
      };

      if (this.githubToken) {
        headers['Authorization'] = `Bearer ${this.githubToken}`;
      }

      // Download the ZIP file
      const downloadResult = await FileSystem.downloadAsync(
        zipUrl,
        FileSystem.cacheDirectory + 'repo.zip',
        { headers }
      );

      if (downloadResult.status !== 200) {
        throw new Error(`Failed to download repository: HTTP ${downloadResult.status}`);
      }

      console.log('Download complete, extracting...');

      // Read the ZIP file
      const zipBase64 = await FileSystem.readAsStringAsync(downloadResult.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to binary
      const zipBinary = atob(zipBase64);
      const zipArray = new Uint8Array(zipBinary.length);
      for (let i = 0; i < zipBinary.length; i++) {
        zipArray[i] = zipBinary.charCodeAt(i);
      }

      // Load and extract the ZIP
      const zip = await JSZip.loadAsync(zipArray);

      console.log('Extracting files...');

      // Get the root folder name (GitHub adds a prefix to the folder)
      const rootFolderName = Object.keys(zip.files)[0].split('/')[0];

      // Extract all files
      let fileCount = 0;
      for (const [filename, file] of Object.entries(zip.files)) {
        // Remove the root folder prefix
        const relativePath = filename.substring(rootFolderName.length + 1);

        if (!relativePath) continue; // Skip the root folder itself

        const fullPath = dir + '/' + relativePath;

        if (file.dir) {
          // Create directory
          await FileSystem.makeDirectoryAsync(fullPath, { intermediates: true });
        } else {
          // Ensure parent directory exists before creating file
          const parentDir = fullPath.substring(0, fullPath.lastIndexOf('/'));
          try {
            await FileSystem.makeDirectoryAsync(parentDir, { intermediates: true });
          } catch (error) {
            // Directory might already exist, ignore
          }

          // Create file
          const content = await file.async('base64');
          await FileSystem.writeAsStringAsync(fullPath, content, {
            encoding: FileSystem.EncodingType.Base64,
          });
          fileCount++;
        }
      }

      console.log(`Extracted ${fileCount} files`);

      // Clean up the temporary ZIP file
      await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });

      console.log('Clone complete!');
    } catch (error: any) {
      console.error('Error cloning from ZIP:', error);

      if (error.message?.includes('404') || error.status === 404) {
        throw new Error('Repository or branch not found. Please check the repository name and branch.');
      } else if (error.message?.includes('401') || error.status === 401) {
        throw new Error('Authentication failed. Please check your GitHub token.');
      } else if (error.message?.includes('403') || error.status === 403) {
        throw new Error('Access denied. Please ensure your token has the correct permissions.');
      } else {
        throw new Error(error.message || 'Failed to clone repository');
      }
    }
  }

  static async clone(url: string, dir: string, depth?: number): Promise<void> {
    try {
      const cloneOptions: any = {
        fs,
        http,
        dir,
        url,
        corsProxy: 'https://cors.isomorphic-git.org',
      };

      // Add authentication if token is available
      if (this.githubToken) {
        cloneOptions.onAuth = () => ({
          username: this.githubToken,
          password: '',
        });
      }

      // Try to clone without specifying depth or singleBranch first
      // This allows git to automatically detect the default branch
      try {
        await git.clone(cloneOptions);
      } catch (firstError: any) {
        // If that fails and it's a HEAD error, try with explicit ref detection
        if (firstError.message?.includes('Could not find HEAD')) {
          console.log('HEAD not found, trying to detect default branch...');

          // Try common default branch names
          const branches = ['main', 'master', 'develop'];
          let cloned = false;

          for (const branch of branches) {
            try {
              console.log(`Trying to clone with ref: ${branch}`);
              await git.clone({
                ...cloneOptions,
                ref: branch,
                singleBranch: true,
              });
              cloned = true;
              break;
            } catch (branchError) {
              console.log(`Failed with branch ${branch}:`, branchError);
              continue;
            }
          }

          if (!cloned) {
            throw firstError;
          }
        } else {
          throw firstError;
        }
      }
    } catch (error: any) {
      console.error('Error cloning repository:', error);

      // Provide more helpful error messages
      if (error.message?.includes('HTTP 404') || error.message?.includes('404')) {
        throw new Error('Repository not found. Please check the URL.');
      } else if (error.message?.includes('HTTP 401') || error.message?.includes('401')) {
        throw new Error('Authentication failed. Please check your GitHub token in Settings.');
      } else if (error.message?.includes('HTTP 403') || error.message?.includes('403')) {
        throw new Error('Access denied. This might be a private repository. Please ensure your GitHub token has the correct permissions.');
      } else if (error.message?.includes('Could not find HEAD')) {
        throw new Error('Repository appears to be empty. Please ensure the repository has at least one commit and a default branch.');
      } else if (error.message?.includes('CORS')) {
        throw new Error('Network error. Please check your internet connection.');
      } else {
        throw new Error(error.message || 'Failed to clone repository');
      }
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
