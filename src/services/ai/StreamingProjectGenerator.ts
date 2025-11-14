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
   * @param config Project configuration
   * @param simulationMode If true, uses mock data instead of AI (for testing UI)
   */
  async generateProject(config: ProjectConfig, simulationMode: boolean = false): Promise<void> {
    try {
      // Phase 1: Analyzing (0-20%)
      await this.analyzeRequirements(config);

      // Phase 2: Planning (20-40%)
      await this.planProjectStructure(config);

      // Phase 3: Creating (40-90%)
      const files = simulationMode
        ? await this.createProjectFilesSimulation(config)
        : await this.createProjectFiles(config);

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
    this.addMessage('progress', '⟳ Creating project files with AI...', 'sparkles');

    try {
      // TRY NEW: Use structured Tool Use approach (95%+ success rate)
      console.log('🤖 Using Claude Tool Use for structured generation...');
      const { StructuredProjectGenerator } = await import('./StructuredProjectGenerator');

      const files = await StructuredProjectGenerator.generateProject(config);

      console.log(`✅ Tool Use generated ${files.length} files`);

      // Simulate streaming file creation for UI
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

        await this.sleep(200);

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

    } catch (toolUseError) {
      // FALLBACK: Use old parsing method if Tool Use fails
      console.warn('⚠️ Tool Use failed, falling back to old method:', toolUseError);
      this.addMessage('info', '  Falling back to text-based generation...');

      return this.createProjectFilesLegacy(config);
    }
  }

  /**
   * Legacy file creation using text parsing (fallback)
   */
  private async createProjectFilesLegacy(config: ProjectConfig): Promise<GeneratedFile[]> {
    // Build AI prompt
    const prompt = this.buildPrompt(config);

    try {
      // Call AI service
      console.log('🤖 Calling AI with prompt...');
      const response = await AIService.generateResponse(prompt, {
        fileName: 'project-generator',
        fileContent: '',
        messages: [],
      });

      console.log('✅ AI Response received, length:', response.content.length);
      console.log('📄 First 500 chars:', response.content.substring(0, 500));

      // Parse response for files
      const parsed = MultiFileGenerator.parseResponse(response.content);

      console.log('📊 Parsed files:', parsed.files.length);
      parsed.files.forEach((f, i) => {
        console.log(`  ${i + 1}. ${f.path} (${f.language}) - ${f.content.length} chars`);
      });

      if (!parsed.hasMultipleFiles || parsed.files.length === 0) {
        console.error('❌ AI Response (full):', response.content);
        throw new Error('AI did not generate valid project files. Check console logs.');
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
   * Phase 3 (Simulation): Create mock project files for testing UI
   */
  private async createProjectFilesSimulation(config: ProjectConfig): Promise<GeneratedFile[]> {
    this.currentPhase = 'creating';
    this.events.onProgress(45, 'Starting file generation (simulation)...');
    this.addMessage('progress', '⟳ Creating project files (simulation)...', 'sparkles');

    // Mock files based on template
    const mockFiles: GeneratedFile[] = [];

    // Always add package.json
    mockFiles.push({
      path: 'package.json',
      content: JSON.stringify({
        name: config.description.split(' ').slice(0, 3).join('-').toLowerCase() || 'my-app',
        version: '1.0.0',
        description: config.description,
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview',
        },
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
        },
        devDependencies: {
          vite: '^5.0.0',
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
        },
      }, null, 2),
      language: 'json',
      action: 'create',
    });

    // Add README
    mockFiles.push({
      path: 'README.md',
      content: `# ${config.description}\n\nGenerated with IDEphone AI Project Generator\n\n## Features\n\n- ${config.framework} framework\n- ${config.styling} styling\n${config.typescript ? '- TypeScript support\n' : ''}${config.tests ? '- Test suite included\n' : ''}\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n`,
      language: 'markdown',
      action: 'create',
    });

    // Add index.html
    mockFiles.push({
      path: 'index.html',
      content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${config.description}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.${config.typescript ? 'tsx' : 'jsx'}"></script>
  </body>
</html>`,
      language: 'html',
      action: 'create',
    });

    // Add src directory files
    mockFiles.push({
      path: `src/main.${config.typescript ? 'tsx' : 'jsx'}`,
      content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root')${config.typescript ? '!' : ''}).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);`,
      language: config.typescript ? 'typescript' : 'javascript',
      action: 'create',
    });

    mockFiles.push({
      path: `src/App.${config.typescript ? 'tsx' : 'jsx'}`,
      content: `${config.typescript ? "import React from 'react';\n\n" : ''}function App() {\n  return (\n    <div className="app">\n      <h1>${config.description}</h1>\n      <p>Built with ${config.framework} and ${config.styling}</p>\n    </div>\n  );\n}\n\nexport default App;`,
      language: config.typescript ? 'typescript' : 'javascript',
      action: 'create',
    });

    mockFiles.push({
      path: 'src/index.css',
      content: `* {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}\n\nbody {\n  font-family: system-ui, -apple-system, sans-serif;\n  background: #0f0f0f;\n  color: #fff;\n}\n\n.app {\n  min-height: 100vh;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  padding: 2rem;\n}\n\nh1 {\n  font-size: 3rem;\n  margin-bottom: 1rem;\n  background: linear-gradient(135deg, #2eaadc 0%, #9f7aea 100%);\n  -webkit-background-clip: text;\n  -webkit-text-fill-color: transparent;\n}\n\np {\n  color: #aaa;\n  font-size: 1.2rem;\n}`,
      language: 'css',
      action: 'create',
    });

    // Add component files
    mockFiles.push({
      path: `src/components/Button.${config.typescript ? 'tsx' : 'jsx'}`,
      content: `${config.typescript ? "import React from 'react';\n\ninterface ButtonProps {\n  onClick?: () => void;\n  children: React.ReactNode;\n}\n\n" : ''}function Button(${config.typescript ? '{ onClick, children }: ButtonProps' : '{ onClick, children }'}) {\n  return (\n    <button onClick={onClick} className="button">\n      {children}\n    </button>\n  );\n}\n\nexport default Button;`,
      language: config.typescript ? 'typescript' : 'javascript',
      action: 'create',
    });

    mockFiles.push({
      path: 'src/components/Card.' + (config.typescript ? 'tsx' : 'jsx'),
      content: `${config.typescript ? "import React from 'react';\n\ninterface CardProps {\n  title: string;\n  children: React.ReactNode;\n}\n\n" : ''}function Card(${config.typescript ? '{ title, children }: CardProps' : '{ title, children }'}) {\n  return (\n    <div className="card">\n      <h2>{title}</h2>\n      <div className="card-content">{children}</div>\n    </div>\n  );\n}\n\nexport default Card;`,
      language: config.typescript ? 'typescript' : 'javascript',
      action: 'create',
    });

    // Add vite config
    if (config.framework === 'vite') {
      mockFiles.push({
        path: 'vite.config.' + (config.typescript ? 'ts' : 'js'),
        content: `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({\n  plugins: [react()],\n});`,
        language: config.typescript ? 'typescript' : 'javascript',
        action: 'create',
      });
    }

    // Add TypeScript config if enabled
    if (config.typescript) {
      mockFiles.push({
        path: 'tsconfig.json',
        content: JSON.stringify({
          compilerOptions: {
            target: 'ES2020',
            useDefineForClassFields: true,
            lib: ['ES2020', 'DOM', 'DOM.Iterable'],
            module: 'ESNext',
            skipLibCheck: true,
            moduleResolution: 'bundler',
            allowImportingTsExtensions: true,
            resolveJsonModule: true,
            isolatedModules: true,
            noEmit: true,
            jsx: 'react-jsx',
            strict: true,
            noUnusedLocals: true,
            noUnusedParameters: true,
            noFallthroughCasesInSwitch: true,
          },
          include: ['src'],
          references: [{ path: './tsconfig.node.json' }],
        }, null, 2),
        language: 'json',
        action: 'create',
      });
    }

    // Add .gitignore if git enabled
    if (config.git) {
      mockFiles.push({
        path: '.gitignore',
        content: `node_modules\ndist\n.env\n.DS_Store\n*.log`,
        language: 'text',
        action: 'create',
      });
    }

    // Simulate streaming file creation
    const progressPerFile = 45 / mockFiles.length;

    for (let i = 0; i < mockFiles.length; i++) {
      const file = mockFiles[i];
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

      await this.sleep(400); // Simulate file creation time

      // Emit file complete event
      this.events.onFileComplete(file.path, file.content);
      this.addMessage('success', `  ✓ Created ${file.path}`, 'checkmark-circle', 1);
      this.updateFileTree(file.path, 'completed');

      this.events.onProgress(
        Math.min(90, currentProgress + progressPerFile),
        `Created ${i + 1}/${mockFiles.length} files`
      );
    }

    return mockFiles;
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

    let prompt = `You are a professional project generator. Create a COMPLETE, BUILDABLE ${template} project that will deploy successfully to Vercel.

PROJECT REQUIREMENTS:
Description: ${description}

TECHNICAL STACK:
- Template: ${template}
- Framework: ${framework}
- Styling: ${styling}
- TypeScript: ${typescript ? 'YES (use .ts/.tsx extensions)' : 'NO (use .js/.jsx)'}
- Tests: ${tests ? 'YES (include test files)' : 'NO'}
- Git: ${git ? 'YES (include .gitignore)' : 'NO'}

CRITICAL RULES - PROJECT MUST BUILD WITHOUT ERRORS:

1. **Format EVERY file using this EXACT syntax:**
   \`\`\`language:path/to/file.ext
   file content here
   \`\`\`

2. **package.json MUST include ALL required dependencies:**
   ${typescript ? `\`\`\`json:package.json
   {
     "name": "my-project",
     "version": "1.0.0",
     "scripts": {
       "dev": "vite",
       "build": "tsc && vite build",
       "preview": "vite preview"
     },
     "dependencies": {
       "react": "^18.2.0",
       "react-dom": "^18.2.0"
     },
     "devDependencies": {
       "@types/react": "^18.2.0",
       "@types/react-dom": "^18.2.0",
       "@vitejs/plugin-react": "^4.2.0",
       "typescript": "^5.0.0",
       "vite": "^5.0.0"
     }
   }
   \`\`\`` : `\`\`\`json:package.json
   {
     "name": "my-project",
     "version": "1.0.0",
     "scripts": {
       "dev": "vite",
       "build": "vite build",
       "preview": "vite preview"
     },
     "dependencies": {
       "react": "^18.2.0",
       "react-dom": "^18.2.0"
     },
     "devDependencies": {
       "@vitejs/plugin-react": "^4.2.0",
       "vite": "^5.0.0"
     }
   }
   \`\`\``}

2b. **index.html MUST have correct Vite script tag:**
   \`\`\`html:index.html
   <!DOCTYPE html>
   <html lang="en">
     <head>
       <meta charset="UTF-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1.0" />
       <title>My Project</title>
     </head>
     <body>
       <div id="root"></div>
       <script type="module" src="/src/main.${typescript ? 'tsx' : 'jsx'}"></script>
     </body>
   </html>
   \`\`\`
   CRITICAL: The script src MUST be "/src/main.${typescript ? 'tsx' : 'jsx'}" (with leading slash)

3. ${typescript ? `**tsconfig.json MUST have jsx configured:**
   \`\`\`json:tsconfig.json
   {
     "compilerOptions": {
       "target": "ES2020",
       "useDefineForClassFields": true,
       "lib": ["ES2020", "DOM", "DOM.Iterable"],
       "module": "ESNext",
       "skipLibCheck": true,
       "moduleResolution": "bundler",
       "allowImportingTsExtensions": true,
       "resolveJsonModule": true,
       "isolatedModules": true,
       "noEmit": true,
       "jsx": "react-jsx",
       "strict": true
     },
     "include": ["src"]
   }
   \`\`\`` : ''}

4. **vite.config.${typescript ? 'ts' : 'js'} is REQUIRED:**
   \`\`\`${typescript ? 'typescript' : 'javascript'}:vite.config.${typescript ? 'ts' : 'js'}
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'

   export default defineConfig({
     plugins: [react()],
   })
   \`\`\`

5. **ONLY import files that you actually create**
   - If you create src/App.${typescript ? 'tsx' : 'jsx'}, you can import it
   - DO NOT import './utils/animations' unless you create src/utils/animations.${typescript ? 'ts' : 'js'}
   - DO NOT import './components/contact' unless you create that file
   - If you import './index.css', you MUST create src/index.css

6. **Required files (YOU MUST CREATE ALL OF THESE):**
   - index.html (root level)
   - package.json (with ALL deps)
   - vite.config.${typescript ? 'ts' : 'js'}
   ${typescript ? '- tsconfig.json (with jsx: "react-jsx")' : ''}
   - src/main.${typescript ? 'tsx' : 'jsx'} (entry point)
   - src/App.${typescript ? 'tsx' : 'jsx'} (main component)
   - **src/index.css (REQUIRED - do not skip this file!)**
   ${git ? '- .gitignore' : ''}

7. **Example src/index.css (you MUST include this):**
   \`\`\`css:src/index.css
   * {
     margin: 0;
     padding: 0;
     box-sizing: border-box;
   }

   body {
     font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
     background: #0f0f0f;
     color: #fff;
   }
   \`\`\`

8. **DO NOT:**
   - Write explanations outside file blocks
   - Import non-existent files
   - Forget React imports in components
   - Forget to export components
   - Skip the src/index.css file

START GENERATING THE PROJECT NOW (minimum 7-10 files, MUST include src/index.css):`;

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
