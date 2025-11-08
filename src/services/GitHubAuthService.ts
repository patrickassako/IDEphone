import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';

WebBrowser.maybeCompleteAuthSession();

const GITHUB_CLIENT_ID = 'Ov23liOWfZgwPCY1F4vw'; // Public client ID for mobile app
const STORAGE_KEY = 'github_token';

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string;
  email: string;
  bio: string;
  public_repos: number;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  clone_url: string;
  html_url: string;
  private: boolean;
  updated_at: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
}

export class GitHubAuthService {
  private static token: string | null = null;
  private static user: GitHubUser | null = null;

  static async initialize(): Promise<void> {
    this.token = await SecureStore.getItemAsync(STORAGE_KEY);
    if (this.token) {
      try {
        await this.fetchUser();
      } catch (error) {
        console.error('Error fetching user:', error);
        this.token = null;
        await SecureStore.deleteItemAsync(STORAGE_KEY);
      }
    }
  }

  static async login(): Promise<boolean> {
    try {
      const discovery = {
        authorizationEndpoint: 'https://github.com/login/oauth/authorize',
        tokenEndpoint: 'https://github.com/login/oauth/access_token',
        revocationEndpoint: `https://github.com/settings/connections/applications/${GITHUB_CLIENT_ID}`,
      };

      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'idephone',
        path: 'auth',
      });

      const request = new AuthSession.AuthRequest({
        clientId: GITHUB_CLIENT_ID,
        scopes: ['repo', 'user'],
        redirectUri,
      });

      const result = await request.promptAsync(discovery);

      if (result.type === 'success') {
        const { code } = result.params;

        // Exchange code for token using GitHub's device flow as fallback
        // For production, you would need a backend to handle the token exchange
        // For now, we'll use personal access token approach
        const token = await this.exchangeCodeForToken(code);

        if (token) {
          this.token = token;
          await SecureStore.setItemAsync(STORAGE_KEY, token);
          await this.fetchUser();
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error during login:', error);
      return false;
    }
  }

  // For demo purposes - in production, use proper OAuth flow with backend
  static async loginWithToken(token: string): Promise<boolean> {
    try {
      this.token = token;
      await SecureStore.setItemAsync(STORAGE_KEY, token);
      await this.fetchUser();
      return true;
    } catch (error) {
      console.error('Error logging in with token:', error);
      return false;
    }
  }

  static async logout(): Promise<void> {
    this.token = null;
    this.user = null;
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  }

  static isAuthenticated(): boolean {
    return this.token !== null;
  }

  static getUser(): GitHubUser | null {
    return this.user;
  }

  static getToken(): string | null {
    return this.token;
  }

  private static async exchangeCodeForToken(code: string): Promise<string | null> {
    // This is a simplified version - in production, you need a backend
    // For now, return null to indicate token input is required
    return null;
  }

  private static async fetchUser(): Promise<void> {
    if (!this.token) throw new Error('No token available');

    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }

    this.user = await response.json();
  }

  static async fetchRepositories(): Promise<GitHubRepository[]> {
    if (!this.token) throw new Error('Not authenticated');

    const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch repositories');
    }

    return await response.json();
  }

  static async searchRepositories(query: string): Promise<GitHubRepository[]> {
    if (!this.token) throw new Error('Not authenticated');

    const response = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=updated&per_page=50`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to search repositories');
    }

    const data = await response.json();
    return data.items;
  }
}
