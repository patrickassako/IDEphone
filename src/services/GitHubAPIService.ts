import { Octokit } from '@octokit/rest';
import { GitHubAuthService } from './GitHubAuthService';

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  clone_url: string;
  ssh_url: string;
  html_url: string;
  default_branch: string;
  updated_at: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export class GitHubAPIService {
  private static octokit: Octokit | null = null;

  /**
   * Initialize the Octokit client with the current access token
   */
  private static getClient(): Octokit {
    const token = GitHubAuthService.getAccessToken();

    if (!token) {
      throw new Error('Not authenticated with GitHub');
    }

    if (!this.octokit) {
      this.octokit = new Octokit({
        auth: token,
      });
    }

    return this.octokit;
  }

  /**
   * Reset the client (useful after logout)
   */
  static resetClient(): void {
    this.octokit = null;
  }

  /**
   * List user's repositories
   */
  static async listUserRepositories(
    sort: 'created' | 'updated' | 'pushed' | 'full_name' = 'updated',
    perPage: number = 30,
    page: number = 1
  ): Promise<GitHubRepository[]> {
    try {
      const client = this.getClient();

      const response = await client.repos.listForAuthenticatedUser({
        sort,
        per_page: perPage,
        page,
      });

      return response.data.map((repo) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        private: repo.private,
        clone_url: repo.clone_url,
        ssh_url: repo.ssh_url,
        html_url: repo.html_url,
        default_branch: repo.default_branch,
        updated_at: repo.updated_at,
        language: repo.language,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        owner: {
          login: repo.owner.login,
          avatar_url: repo.owner.avatar_url,
        },
      }));
    } catch (error) {
      console.error('Error listing repositories:', error);
      throw error;
    }
  }

  /**
   * Search repositories
   */
  static async searchRepositories(
    query: string,
    perPage: number = 30,
    page: number = 1
  ): Promise<GitHubRepository[]> {
    try {
      const client = this.getClient();

      const response = await client.search.repos({
        q: query,
        per_page: perPage,
        page,
      });

      return response.data.items.map((repo) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        private: repo.private,
        clone_url: repo.clone_url,
        ssh_url: repo.ssh_url,
        html_url: repo.html_url,
        default_branch: repo.default_branch,
        updated_at: repo.updated_at,
        language: repo.language,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        owner: {
          login: repo.owner.login,
          avatar_url: repo.owner.avatar_url,
        },
      }));
    } catch (error) {
      console.error('Error searching repositories:', error);
      throw error;
    }
  }

  /**
   * Get a specific repository
   */
  static async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    try {
      const client = this.getClient();

      const response = await client.repos.get({
        owner,
        repo,
      });

      const data = response.data;

      return {
        id: data.id,
        name: data.name,
        full_name: data.full_name,
        description: data.description,
        private: data.private,
        clone_url: data.clone_url,
        ssh_url: data.ssh_url,
        html_url: data.html_url,
        default_branch: data.default_branch,
        updated_at: data.updated_at,
        language: data.language,
        stargazers_count: data.stargazers_count,
        forks_count: data.forks_count,
        owner: {
          login: data.owner.login,
          avatar_url: data.owner.avatar_url,
        },
      };
    } catch (error) {
      console.error('Error getting repository:', error);
      throw error;
    }
  }

  /**
   * List branches for a repository
   */
  static async listBranches(owner: string, repo: string): Promise<string[]> {
    try {
      const client = this.getClient();

      const response = await client.repos.listBranches({
        owner,
        repo,
      });

      return response.data.map((branch) => branch.name);
    } catch (error) {
      console.error('Error listing branches:', error);
      throw error;
    }
  }

  /**
   * Create a new repository
   */
  static async createRepository(
    name: string,
    description?: string,
    isPrivate: boolean = false
  ): Promise<GitHubRepository> {
    try {
      const client = this.getClient();

      const response = await client.repos.createForAuthenticatedUser({
        name,
        description,
        private: isPrivate,
      });

      const data = response.data;

      return {
        id: data.id,
        name: data.name,
        full_name: data.full_name,
        description: data.description,
        private: data.private,
        clone_url: data.clone_url,
        ssh_url: data.ssh_url,
        html_url: data.html_url,
        default_branch: data.default_branch,
        updated_at: data.updated_at,
        language: data.language,
        stargazers_count: data.stargazers_count,
        forks_count: data.forks_count,
        owner: {
          login: data.owner.login,
          avatar_url: data.owner.avatar_url,
        },
      };
    } catch (error) {
      console.error('Error creating repository:', error);
      throw error;
    }
  }

  /**
   * Fork a repository
   */
  static async forkRepository(owner: string, repo: string): Promise<GitHubRepository> {
    try {
      const client = this.getClient();

      const response = await client.repos.createFork({
        owner,
        repo,
      });

      const data = response.data;

      return {
        id: data.id,
        name: data.name,
        full_name: data.full_name,
        description: data.description,
        private: data.private,
        clone_url: data.clone_url,
        ssh_url: data.ssh_url,
        html_url: data.html_url,
        default_branch: data.default_branch,
        updated_at: data.updated_at,
        language: data.language,
        stargazers_count: data.stargazers_count,
        forks_count: data.forks_count,
        owner: {
          login: data.owner.login,
          avatar_url: data.owner.avatar_url,
        },
      };
    } catch (error) {
      console.error('Error forking repository:', error);
      throw error;
    }
  }

  /**
   * Get repository content
   */
  static async getContent(
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<any> {
    try {
      const client = this.getClient();

      const response = await client.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });

      return response.data;
    } catch (error) {
      console.error('Error getting content:', error);
      throw error;
    }
  }
}
