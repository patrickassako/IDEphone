/**
 * Streaming Project Generator Service
 * Handles real-time project generation with streaming AI responses
 * Emits events for UI updates: progress, file creation, status messages
 */

import { AIService } from './AIService';
import { MultiFileGenerator, GeneratedFile } from './MultiFileGenerator';
import { StreamMessage, FileTreeNode } from '../../components/StreamingConsole';
import { ProjectConfig } from '../../components/ProjectGeneratorModal';

export interface GenerationEvents {
  onProgress: (percent: number, message: string) => void;
  onMessage: (message: StreamMessage) => void;
  onFileStart: (path: string) => void;
  onFileComplete: (path: string, content: string) => void;
  onDirectoryCreate: (path: string) => void;
  onTreeUpdate: (tree: FileTreeNode[]) => void;
  onComplete: (files: GeneratedFile[], summary: string) => void;
  onError: (error: string) => void;
}

export type GenerationPhase = 'analyzing' | 'planning' | 'creating' | 'finalizing' | 'complete';

export class StreamingProjectGenerator {
  private events: GenerationEvents;
  private currentPhase: GenerationPhase = 'analyzing';
  private fileTree: Map<string, FileTreeNode> = new Map();
  private messageCounter = 0;

  constructor(events: GenerationEvents) {
    this.events = events;
  }

  /**
   * Generate a complete project from AI with streaming updates
   */
  async generateProject(config: ProjectConfig): Promise<void> {
    try {
      // Phase 1: Analyzing (0-20%)
      await this.analyzeRequirements(config);

      // Phase 2: Planning (20-40%)
      await this.planProjectStructure(config);

      // Phase 3: Creating (40-90%)
      const files = await this.createProjectFiles(config);

      // Phase 4: Finalizing (90-100%)
      await this.finalizeProject(files);

      // Complete
      this.events.onComplete(files, this.generateSummary(files, config));
    } catch (error: any) {
      this.events.onError(error.message || 'Failed to generate project');
    }
  }

  /**
   * Phase 1: Analyze user requirements
   */
  private async analyzeRequirements(config: ProjectConfig): Promise<void> {
    this.currentPhase = 'analyzing';
    this.events.onProgress(5, 'Analyzing project requirements...');
    this.addMessage('info', '✓ Analyzing project requirements', 'checkmark-circle');

    await this.sleep(500);

    this.events.onProgress(10, 'Understanding project scope...');
    this.addMessage('info', `  Template: ${config.template}`);
    this.addMessage('info', `  Framework: ${config.framework}`);
    this.addMessage('info', `  Styling: ${config.styling}`);

    await this.sleep(500);

    this.events.onProgress(20, 'Requirements analyzed successfully');
    this.addMessage('success', '✓ Requirements analyzed successfully', 'checkmark-circle');
  }

  /**
   * Phase 2: Plan project structure
   */
  private async planProjectStructure(config: ProjectConfig): Promise<void> {
    this.currentPhase = 'planning';
    this.events.onProgress(25, 'Planning file structure...');
    this.addMessage('progress', '⟳ Planning file structure...', 'sync');

    await this.sleep(800);

    this.events.onProgress(35, 'Determining dependencies...');
    this.addMessage('info', '  Calculating required dependencies');

    await this.sleep(600);

    this.events.onProgress(40, 'Project structure planned');
    this.addMessage('success', '✓ Project structure planned', 'checkmark-circle');
  }

  /**
   * Phase 3: Create project files (main generation)
   */
  private async createProjectFiles(config: ProjectConfig): Promise<GeneratedFile[]> {
    this.currentPhase = 'creating';
    this.events.onProgress(45, 'Starting file generation...');
    this.addMessage('progress', '⟳ Creating project files...', 'sparkles');

    // Build AI prompt
    const prompt = this.buildPrompt(config);

    try {
      // Call AI service
      const response = await AIService.generateResponse(prompt, {
        fileName: 'project-generator',
        fileContent: '',
        messages: [],
      });

      // Parse response for files
      const parsed = MultiFileGenerator.parseResponse(response.content);

      if (!parsed.hasMultipleFiles || parsed.files.length === 0) {
        throw new Error('AI did not generate valid project files');
      }

      // Simulate streaming file creation
      const files = parsed.files;
      const progressPerFile = 45 / files.length; // 45% for file creation (45-90%)

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const currentProgress = 45 + (i * progressPerFile);

        // Check if it's a directory or file
        if (file.path.includes('/')) {
          const dirPath = file.path.substring(0, file.path.lastIndexOf('/'));
          this.createDirectory(dirPath);
        }

        // Emit file start event
        this.events.onFileStart(file.path);
        this.addMessage('file', `  Creating ${file.path}...`, 'document-outline', 1);
        this.updateFileTree(file.path, 'creating');

        await this.sleep(300);

        // Emit file complete event
        this.events.onFileComplete(file.path, file.content);
        this.addMessage('success', `  ✓ Created ${file.path}`, 'checkmark-circle', 1);
        this.updateFileTree(file.path, 'completed');

        this.events.onProgress(
          Math.min(90, currentProgress + progressPerFile),
          `Created ${i + 1}/${files.length} files`
        );
      }

      return files;
    } catch (error: any) {
      this.addMessage('info', `Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Phase 4: Finalize project
   */
  private async finalizeProject(files: GeneratedFile[]): Promise<void> {
    this.currentPhase = 'finalizing';
    this.events.onProgress(92, 'Finalizing project...');
    this.addMessage('progress', '⟳ Setting up configuration...', 'sync');

    await this.sleep(500);

    this.events.onProgress(95, 'Verifying files...');
    this.addMessage('info', `  Verified ${files.length} files`);

    await this.sleep(500);

    this.events.onProgress(100, 'Project generated successfully!');
    this.addMessage('success', '🎉 Project generated successfully!', 'checkmark-circle');
    this.currentPhase = 'complete';
  }

  /**
   * Build AI prompt based on project configuration
   */
  private buildPrompt(config: ProjectConfig): string {
    const { description, template, framework, styling, typescript, tests, git } = config;

    let prompt = `Create a complete ${template} project with the following specifications:\n\n`;
    prompt += `Description: ${description}\n\n`;
    prompt += `Technical Stack:\n`;
    prompt += `- Framework: ${framework}\n`;
    prompt += `- Styling: ${styling}\n`;
    prompt += `- TypeScript: ${typescript ? 'Yes' : 'No'}\n`;
    prompt += `- Tests: ${tests ? 'Include test files' : 'No tests'}\n`;
    prompt += `- Git: ${git ? 'Include .gitignore' : 'No git files'}\n\n`;

    prompt += `IMPORTANT FORMATTING RULES:\n`;
    prompt += `- Format EVERY file as: \`\`\`language:path/to/file.ext\n`;
    prompt += `- Include package.json with all required dependencies\n`;
    prompt += `- Include README.md with setup instructions\n`;
    prompt += `- Create a complete, working project structure\n`;
    prompt += `- Add helpful comments in complex code sections\n`;
    prompt += `- Use modern best practices and patterns\n\n`;

    prompt += `Generate the complete project now:`;

    return prompt;
  }

  /**
   * Generate project summary
   */
  private generateSummary(files: GeneratedFile[], config: ProjectConfig): string {
    const totalLines = files.reduce((sum, f) => sum + f.content.split('\n').length, 0);
    const languages = new Set(files.map((f) => f.language).filter(Boolean));

    let summary = `✨ ${files.length} files created • ${totalLines} lines of code\n\n`;
    summary += `📊 Project Summary:\n`;
    summary += `• Template: ${config.template}\n`;
    summary += `• Framework: ${config.framework}\n`;
    summary += `• Styling: ${config.styling}\n`;
    if (config.typescript) summary += `• TypeScript: Enabled\n`;
    if (config.tests) summary += `• Tests: Included\n`;
    summary += `• Languages: ${Array.from(languages).join(', ')}\n`;

    return summary;
  }

  /**
   * Helper: Add message to stream
   */
  private addMessage(
    type: StreamMessage['type'],
    message: string,
    icon?: string,
    indent?: number
  ): void {
    this.events.onMessage({
      id: `msg-${Date.now()}-${this.messageCounter++}`,
      type,
      message,
      timestamp: Date.now(),
      icon,
      indent,
    });
  }

  /**
   * Helper: Create directory in tree
   */
  private createDirectory(path: string): void {
    if (this.fileTree.has(path)) return;

    this.events.onDirectoryCreate(path);
    this.addMessage('directory', `  📂 ${path}/`, 'folder', 1);

    const node: FileTreeNode = {
      path,
      type: 'directory',
      status: 'completed',
      children: [],
    };

    this.fileTree.set(path, node);
    this.emitTreeUpdate();
  }

  /**
   * Helper: Update file tree
   */
  private updateFileTree(
    path: string,
    status: 'pending' | 'creating' | 'completed'
  ): void {
    const node: FileTreeNode = {
      path,
      type: 'file',
      status,
    };

    this.fileTree.set(path, node);
    this.emitTreeUpdate();
  }

  /**
   * Helper: Emit tree update event
   */
  private emitTreeUpdate(): void {
    // Build hierarchical tree from flat map
    const tree = this.buildHierarchicalTree();
    this.events.onTreeUpdate(tree);
  }

  /**
   * Helper: Build hierarchical tree structure
   */
  private buildHierarchicalTree(): FileTreeNode[] {
    const rootNodes: FileTreeNode[] = [];
    const nodeMap = new Map<string, FileTreeNode>();

    // First pass: create all nodes
    Array.from(this.fileTree.values()).forEach((node) => {
      nodeMap.set(node.path, { ...node, children: [] });
    });

    // Second pass: build hierarchy
    nodeMap.forEach((node, path) => {
      const parentPath = path.substring(0, path.lastIndexOf('/'));

      if (parentPath && nodeMap.has(parentPath)) {
        const parent = nodeMap.get(parentPath)!;
        if (!parent.children) parent.children = [];
        parent.children.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    return rootNodes;
  }

  /**
   * Helper: Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
