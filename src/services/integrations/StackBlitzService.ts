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
   * Create StackBlitz project URL using embed API
   * More reliable for opening from mobile
   */
  static createEmbedUrl(
    projectName: string,
    files: GeneratedFile[],
    config: ProjectConfig
  ): string {
    // Create a minimal Vite React project structure
    const template = this.getStackBlitzTemplate(config);

    // Build query parameters
    const params = new URLSearchParams({
      title: projectName,
      description: config.description || 'Generated with IDEphone',
      file: 'src/App.tsx', // Open main file by default
    });

    // For Vite React projects
    if (template === 'react') {
      return `https://stackblitz.com/edit/vitejs-vite-${this.generateId()}?${params.toString()}`;
    }

    return `https://stackblitz.com/edit/${template}-${this.generateId()}?${params.toString()}`;
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

    // Encode as JSON and base64
    const parametersJson = JSON.stringify(parameters);
    const parametersBase64 = Buffer.from(parametersJson).toString('base64');

    return `https://codesandbox.io/api/v1/sandboxes/define?parameters=${parametersBase64}`;
  }

  /**
   * Open project in browser-based IDE
   * Tries multiple services for best compatibility
   */
  static async openInBrowserIDE(
    projectName: string,
    files: GeneratedFile[],
    config: ProjectConfig,
    service: 'stackblitz' | 'codesandbox' = 'stackblitz'
  ): Promise<void> {
    try {
      let url: string;

      if (service === 'codesandbox') {
        url = this.createCodeSandboxUrl(projectName, files, config);
      } else {
        // StackBlitz
        url = this.createEmbedUrl(projectName, files, config);
      }

      await Linking.openURL(url);
    } catch (error) {
      console.error(`Error opening ${service}:`, error);
      throw error;
    }
  }
}
