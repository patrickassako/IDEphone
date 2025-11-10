/**
 * StackBlitz Integration Service
 * Opens projects in StackBlitz for live testing and development
 * Uses StackBlitz API to create projects from generated files
 */

import { GeneratedFile } from '../ai/MultiFileGenerator';
import { ProjectConfig } from '../../components/ProjectGeneratorModal';
import { Linking } from 'react-native';

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
   * Uses custom implementation since btoa is not available in React Native
   */
  private static base64Encode(str: string): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';

    for (let i = 0; i < str.length; i += 3) {
      const a = str.charCodeAt(i);
      const b = i + 1 < str.length ? str.charCodeAt(i + 1) : 0;
      const c = i + 2 < str.length ? str.charCodeAt(i + 2) : 0;

      const bitmap = (a << 16) | (b << 8) | c;

      output += chars[(bitmap >> 18) & 63];
      output += chars[(bitmap >> 12) & 63];
      output += i + 1 < str.length ? chars[(bitmap >> 6) & 63] : '=';
      output += i + 2 < str.length ? chars[bitmap & 63] : '=';
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
   * CodeSandbox also works well from mobile
   * Uses proper base64 encoding compatible with React Native
   */
  static createCodeSandboxUrl(
    projectName: string,
    files: GeneratedFile[],
    config: ProjectConfig
  ): string {
    // Convert files to CodeSandbox format
    const sandboxFiles: { [path: string]: { content: string } } = {};

    files.forEach((file) => {
      sandboxFiles[file.path] = { content: file.content };
    });

    // Create sandbox parameters
    const parameters = {
      files: sandboxFiles,
    };

    // Encode as JSON and base64 (React Native compatible)
    const parametersJson = JSON.stringify(parameters);

    // URL encode for safe base64 encoding
    const parametersBase64 = this.base64Encode(parametersJson);

    return `https://codesandbox.io/api/v1/sandboxes/define?parameters=${parametersBase64}`;
  }

  /**
   * Open project in browser-based IDE
   *
   * IMPORTANT:
   * - CodeSandbox: Uploads your custom files ✅ (Recommended)
   * - StackBlitz: Opens template only, custom files NOT included ⚠️
   *
   * For full code preview with your generated files, use CodeSandbox
   */
  static async openInBrowserIDE(
    projectName: string,
    files: GeneratedFile[],
    config: ProjectConfig,
    service: 'stackblitz' | 'codesandbox' = 'codesandbox' // Changed default to codesandbox
  ): Promise<void> {
    try {
      let url: string;

      if (service === 'codesandbox') {
        // CodeSandbox: Creates a real sandbox with your files
        url = this.createCodeSandboxUrl(projectName, files, config);
      } else {
        // StackBlitz: Opens a starter template (files not included)
        console.warn('⚠️ StackBlitz from mobile opens template only. Your custom files won\'t be included.');
        url = this.createEmbedUrl(projectName, files, config);
      }

      console.log(`Opening project in ${service}...`);
      await Linking.openURL(url);
    } catch (error) {
      console.error(`Error opening ${service}:`, error);
      throw error;
    }
  }
}
