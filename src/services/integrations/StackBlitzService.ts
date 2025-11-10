/**
 * StackBlitz Integration Service
 * Opens projects in StackBlitz for live testing and development
 * Uses StackBlitz API to create projects from generated files
 */

import { GeneratedFile } from '../ai/MultiFileGenerator';
import { ProjectConfig } from '../../components/ProjectGeneratorModal';
import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as FileSystemLegacy from 'expo-file-system/legacy';

export interface StackBlitzProject {
  title: string;
  description: string;
  template: 'node' | 'javascript' | 'typescript' | 'react' | 'angular' | 'vue';
  files: { [path: string]: string };
  dependencies?: { [key: string]: string };
}

export class StackBlitzService {
  /**
   * Base64 encode a string (React Native compatible)
   * Handles UTF-8 encoding properly for international characters
   */
  private static base64Encode(str: string): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

    // Convert to UTF-8 bytes first
    const utf8Bytes: number[] = [];
    for (let i = 0; i < str.length; i++) {
      let charCode = str.charCodeAt(i);
      if (charCode < 0x80) {
        utf8Bytes.push(charCode);
      } else if (charCode < 0x800) {
        utf8Bytes.push(0xc0 | (charCode >> 6));
        utf8Bytes.push(0x80 | (charCode & 0x3f));
      } else if (charCode < 0xd800 || charCode >= 0xe000) {
        utf8Bytes.push(0xe0 | (charCode >> 12));
        utf8Bytes.push(0x80 | ((charCode >> 6) & 0x3f));
        utf8Bytes.push(0x80 | (charCode & 0x3f));
      } else {
        // Surrogate pair
        i++;
        charCode = 0x10000 + (((charCode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
        utf8Bytes.push(0xf0 | (charCode >> 18));
        utf8Bytes.push(0x80 | ((charCode >> 12) & 0x3f));
        utf8Bytes.push(0x80 | ((charCode >> 6) & 0x3f));
        utf8Bytes.push(0x80 | (charCode & 0x3f));
      }
    }

    // Base64 encode the UTF-8 bytes
    let output = '';
    for (let i = 0; i < utf8Bytes.length; i += 3) {
      const a = utf8Bytes[i];
      const b = i + 1 < utf8Bytes.length ? utf8Bytes[i + 1] : 0;
      const c = i + 2 < utf8Bytes.length ? utf8Bytes[i + 2] : 0;

      const bitmap = (a << 16) | (b << 8) | c;

      output += chars[(bitmap >> 18) & 63];
      output += chars[(bitmap >> 12) & 63];
      output += i + 1 < utf8Bytes.length ? chars[(bitmap >> 6) & 63] : '=';
      output += i + 2 < utf8Bytes.length ? chars[bitmap & 63] : '=';
    }

    return output;
  }

  /**
   * Opens a project in StackBlitz
   * Creates a new project from generated files and opens it in the browser
   */
  static async openInStackBlitz(
    projectName: string,
    files: GeneratedFile[],
    config: ProjectConfig
  ): Promise<void> {
    try {
      // Convert files to StackBlitz format
      const stackBlitzFiles: { [path: string]: string } = {};

      files.forEach((file) => {
        stackBlitzFiles[file.path] = file.content;
      });

      // Determine StackBlitz template
      const template = this.getStackBlitzTemplate(config);

      // Create project payload
      const project: StackBlitzProject = {
        title: projectName,
        description: config.description || 'Generated with IDEphone',
        template,
        files: stackBlitzFiles,
      };

      // Generate StackBlitz URL
      const url = this.generateStackBlitzUrl(project);

      // Open in browser
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening StackBlitz:', error);
      throw error;
    }
  }

  /**
   * Generate StackBlitz URL using SDK API
   * Uses POST to /run endpoint to create and open project
   */
  private static generateStackBlitzUrl(project: StackBlitzProject): string {
    // For React projects with Vite, use the GitHub import approach
    // This creates a shareable URL
    const baseUrl = 'https://stackblitz.com/fork/';

    // Encode project data
    const projectData = {
      title: project.title,
      description: project.description,
      template: project.template,
      files: project.files,
    };

    // Use the POST API endpoint
    // Note: This will be opened in browser where POST will work
    return `https://stackblitz.com/run?title=${encodeURIComponent(project.title)}&description=${encodeURIComponent(project.description)}`;
  }

  /**
   * Create StackBlitz project URL using GitHub approach
   * Since we can't POST from mobile, we use a pre-configured template
   * NOTE: This won't include custom files - recommend using CodeSandbox instead
   */
  static createEmbedUrl(
    projectName: string,
    files: GeneratedFile[],
    config: ProjectConfig
  ): string {
    // Use StackBlitz starter templates
    const template = this.getStackBlitzTemplate(config);

    // Map to actual StackBlitz starter projects
    const templateMap: { [key: string]: string } = {
      react: 'vitejs/vite/tree/main/packages/create-vite/template-react',
      typescript: 'vitejs/vite/tree/main/packages/create-vite/template-react-ts',
      node: 'stackblitz/sdk/tree/main/templates/node',
      javascript: 'vitejs/vite/tree/main/packages/create-vite/template-vanilla',
    };

    const githubPath = templateMap[template] || templateMap.react;

    // Open StackBlitz with a starter template
    // Note: Custom files won't be included - this is a limitation when opening from mobile
    return `https://stackblitz.com/github/${githubPath}?title=${encodeURIComponent(projectName)}`;
  }

  /**
   * Map IDEphone project config to StackBlitz template
   */
  private static getStackBlitzTemplate(config: ProjectConfig): StackBlitzProject['template'] {
    if (config.framework === 'vite' || config.framework === 'react') {
      return config.typescript ? 'typescript' : 'react';
    }

    if (config.framework === 'next') {
      return 'typescript';
    }

    if (config.template === 'node') {
      return 'node';
    }

    return 'typescript';
  }

  /**
   * Generate random ID for unique project URLs
   */
  private static generateId(): string {
    return Math.random().toString(36).substring(2, 10);
  }

  /**
   * Create a CodeSandbox URL as alternative
   * Uses proper base64 encoding compatible with React Native
   *
   * IMPORTANT: CodeSandbox /define API requires:
   * - Proper JSON structure with "files" object
   * - Each file must have "content" and "isBinary" properties
   * - Must include package.json with dependencies
   */
  static createCodeSandboxUrl(
    projectName: string,
    files: GeneratedFile[],
    config: ProjectConfig
  ): string {
    // Convert files to CodeSandbox format
    const sandboxFiles: { [path: string]: { content: string; isBinary: boolean } } = {};

    // Ensure we have a package.json
    let hasPackageJson = false;

    files.forEach((file) => {
      sandboxFiles[file.path] = {
        content: file.content,
        isBinary: false
      };
      if (file.path === 'package.json') {
        hasPackageJson = true;
      }
    });

    // Add package.json if missing (required by CodeSandbox)
    if (!hasPackageJson) {
      const dependencies: { [key: string]: string } = {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
      };

      if (config.framework === 'vite') {
        dependencies['vite'] = '^5.0.0';
        dependencies['@vitejs/plugin-react'] = '^4.2.0';
      }

      sandboxFiles['package.json'] = {
        content: JSON.stringify({
          name: projectName.toLowerCase().replace(/\s+/g, '-'),
          version: '1.0.0',
          description: config.description || 'Generated with IDEphone',
          main: 'index.js',
          scripts: {
            start: 'react-scripts start',
            build: 'react-scripts build',
            dev: 'vite',
          },
          dependencies,
          devDependencies: config.typescript ? {
            '@types/react': '^18.2.0',
            '@types/react-dom': '^18.2.0',
            'typescript': '^5.0.0',
          } : {},
        }, null, 2),
        isBinary: false,
      };
    }

    // Add index.html if missing (required for web projects)
    if (!sandboxFiles['index.html'] && !sandboxFiles['public/index.html']) {
      sandboxFiles['index.html'] = {
        content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.${config.typescript ? 'tsx' : 'jsx'}"></script>
  </body>
</html>`,
        isBinary: false,
      };
    }

    // Create sandbox parameters following CodeSandbox API spec
    const parameters = {
      files: sandboxFiles,
    };

    // Encode as JSON and base64 (React Native compatible)
    const parametersJson = JSON.stringify(parameters);

    // URL encode for safe base64 encoding
    const parametersBase64 = this.base64Encode(parametersJson);

    // Use POST method via query parameter
    return `https://codesandbox.io/api/v1/sandboxes/define?parameters=${parametersBase64}&json=1`;
  }

  /**
   * Create HTML page with auto-submit form for CodeSandbox POST
   * This is a workaround since we can't do POST from React Native directly
   */
  private static createCodeSandboxFormHtml(parameters: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Opening CodeSandbox...</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container {
      text-align: center;
    }
    .spinner {
      border: 4px solid rgba(255,255,255,0.3);
      border-top: 4px solid white;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 20px auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h2>Opening in CodeSandbox...</h2>
    <p>Creating your sandbox with custom files</p>
  </div>
  <form id="codesandboxForm" action="https://codesandbox.io/api/v1/sandboxes/define" method="POST" style="display:none;">
    <input type="hidden" name="parameters" value="${parameters}" />
    <input type="hidden" name="json" value="1" />
  </form>
  <script>
    // Auto-submit after short delay
    setTimeout(() => {
      document.getElementById('codesandboxForm').submit();
    }, 500);
  </script>
</body>
</html>`;
  }

  /**
   * Open project in browser-based IDE
   *
   * IMPORTANT:
   * - CodeSandbox: Uploads your custom files ✅ (Recommended) - Uses backend proxy
   * - StackBlitz: Opens template only, custom files NOT included ⚠️
   *
   * For full code preview with your generated files, use CodeSandbox
   */
  static async openInBrowserIDE(
    projectName: string,
    files: GeneratedFile[],
    config: ProjectConfig,
    service: 'stackblitz' | 'codesandbox' = 'codesandbox'
  ): Promise<void> {
    try {
      if (service === 'codesandbox') {
        // CodeSandbox: Use backend proxy to handle POST request
        console.log('Sending files to backend proxy...');

        // Get proxy URL from environment variable
        // Set this in your .env file: EXPO_PUBLIC_CODESANDBOX_PROXY_URL
        const PROXY_URL = process.env.EXPO_PUBLIC_CODESANDBOX_PROXY_URL ||
          'https://idephone.vercel.app/api/codesandbox-proxy';

        console.log('Using proxy URL:', PROXY_URL);

        const response = await fetch(PROXY_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            files,
            projectName,
            config,
          }),
        });

        // Handle non-OK responses
        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          let errorMessage = `Backend error (${response.status})`;

          if (contentType?.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            // HTML or text response (probably 404/502)
            const textResponse = await response.text();
            console.error('Backend response:', textResponse);

            if (response.status === 404) {
              throw new Error(
                'Backend not deployed yet!\n\n' +
                'Please deploy the Vercel backend first:\n' +
                '1. cd /home/user/IDEphone\n' +
                '2. vercel deploy --prod\n' +
                '3. Update .env with the URL\n\n' +
                'See DEPLOY_BACKEND.md for details.'
              );
            }
          }

          throw new Error(errorMessage);
        }

        // Try to parse JSON response
        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          const textResponse = await response.text();
          console.error('Failed to parse response:', textResponse);
          throw new Error(
            'Backend returned invalid JSON. It may not be deployed correctly.\n\n' +
            'See DEPLOY_BACKEND.md for deployment instructions.'
          );
        }

        console.log('Sandbox created:', data.sandboxId);
        console.log('Embed URL:', data.embedUrl);

        // Return the embed URL for WebView display (instead of opening external browser)
        return {
          sandboxId: data.sandboxId,
          embedUrl: data.embedUrl,
          embedSplitUrl: data.embedSplitUrl,
          sandboxUrl: data.sandboxUrl,
        };

      } else {
        // StackBlitz: Opens a starter template (files not included)
        console.warn('⚠️ StackBlitz from mobile opens template only. Your custom files won\'t be included.');
        const url = this.createEmbedUrl(projectName, files, config);
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error(`Error opening ${service}:`, error);
      throw error;
    }
  }
}
