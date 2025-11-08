import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const GITHUB_TOKEN_KEY = 'github_access_token';
const GITHUB_USER_KEY = 'github_user';

// GitHub OAuth configuration
// Note: Pour la production, vous devrez créer une GitHub OAuth App
// et utiliser vos propres client_id et client_secret
const CLIENT_ID = 'YOUR_GITHUB_CLIENT_ID'; // À remplacer
const REDIRECT_URI = AuthSession.makeRedirectUri({
  scheme: 'idephone',
  path: 'auth',
});

export interface GitHubUser {
  login: string;
  name: string;
  email: string;
  avatar_url: string;
  bio?: string;
  public_repos: number;
}

export class GitHubAuthService {
  private static accessToken: string | null = null;
  private static user: GitHubUser | null = null;

  /**
   * Initialize the service by loading saved credentials
   */
  static async initialize(): Promise<void> {
    try {
      const token = await SecureStore.getItemAsync(GITHUB_TOKEN_KEY);
      const userString = await SecureStore.getItemAsync(GITHUB_USER_KEY);

      if (token) {
        this.accessToken = token;
      }

      if (userString) {
        this.user = JSON.parse(userString);
      }
    } catch (error) {
      console.error('Error initializing GitHub auth:', error);
    }
  }

  /**
   * Authenticate with GitHub using Device Flow (better for mobile apps)
   * This method doesn't require a redirect URI
   */
  static async authenticateWithDeviceFlow(): Promise<boolean> {
    try {
      // Step 1: Request device code
      const deviceCodeResponse = await fetch(
        'https://github.com/login/device/code',
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: CLIENT_ID,
            scope: 'repo user',
          }),
        }
      );

      const deviceCodeData = await deviceCodeResponse.json();
      const { device_code, user_code, verification_uri, interval } = deviceCodeData;

      // Step 2: Open browser for user to enter code
      await WebBrowser.openBrowserAsync(verification_uri);

      // Return user_code so it can be displayed to the user
      console.log('User code:', user_code);

      // Step 3: Poll for access token
      let accessToken = null;
      const pollInterval = (interval || 5) * 1000; // Convert to milliseconds

      while (!accessToken) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));

        const tokenResponse = await fetch(
          'https://github.com/login/oauth/access_token',
          {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              client_id: CLIENT_ID,
              device_code: device_code,
              grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
            }),
          }
        );

        const tokenData = await tokenResponse.json();

        if (tokenData.access_token) {
          accessToken = tokenData.access_token;
          break;
        } else if (tokenData.error === 'authorization_pending') {
          // Continue polling
          continue;
        } else {
          // Error occurred
          throw new Error(tokenData.error_description || 'Authentication failed');
        }
      }

      // Save access token
      this.accessToken = accessToken;
      await SecureStore.setItemAsync(GITHUB_TOKEN_KEY, accessToken);

      // Fetch user information
      await this.fetchUserInfo();

      return true;
    } catch (error) {
      console.error('Error authenticating with GitHub:', error);
      return false;
    }
  }

  /**
   * Authenticate using Personal Access Token (simpler for testing)
   */
  static async authenticateWithToken(token: string): Promise<boolean> {
    try {
      this.accessToken = token;
      await SecureStore.setItemAsync(GITHUB_TOKEN_KEY, token);

      // Verify token by fetching user info
      const success = await this.fetchUserInfo();

      if (!success) {
        this.accessToken = null;
        await SecureStore.deleteItemAsync(GITHUB_TOKEN_KEY);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error authenticating with token:', error);
      return false;
    }
  }

  /**
   * Fetch user information from GitHub
   */
  private static async fetchUserInfo(): Promise<boolean> {
    try {
      if (!this.accessToken) {
        return false;
      }

      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      const userData = await response.json();

      this.user = {
        login: userData.login,
        name: userData.name || userData.login,
        email: userData.email || '',
        avatar_url: userData.avatar_url,
        bio: userData.bio,
        public_repos: userData.public_repos,
      };

      await SecureStore.setItemAsync(GITHUB_USER_KEY, JSON.stringify(this.user));

      return true;
    } catch (error) {
      console.error('Error fetching user info:', error);
      return false;
    }
  }

  /**
   * Sign out and clear stored credentials
   */
  static async signOut(): Promise<void> {
    try {
      this.accessToken = null;
      this.user = null;
      await SecureStore.deleteItemAsync(GITHUB_TOKEN_KEY);
      await SecureStore.deleteItemAsync(GITHUB_USER_KEY);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  /**
   * Get the current access token
   */
  static getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Get the current user
   */
  static getUser(): GitHubUser | null {
    return this.user;
  }

  /**
   * Refresh user information
   */
  static async refreshUserInfo(): Promise<boolean> {
    return await this.fetchUserInfo();
  }
}
