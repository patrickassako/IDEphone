/**
 * Project Generation API using Claude Tool Use
 * Generates complete projects with structured output
 */

const Anthropic = require('@anthropic-ai/sdk');

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { config } = req.body;

    if (!config || !config.description) {
      return res.status(400).json({
        error: 'Missing project config',
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'ANTHROPIC_API_KEY not configured',
      });
    }

    console.log(`Generating project: ${config.description}`);

    const anthropic = new Anthropic({ apiKey });

    // Define the create_file tool
    const tools = [
      {
        name: 'create_file',
        description: 'Create a new file in the project with specified content',
        input_schema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path relative to project root (e.g., "src/App.tsx", "package.json")',
            },
            content: {
              type: 'string',
              description: 'Complete file content',
            },
            language: {
              type: 'string',
              description: 'Programming language (typescript, javascript, json, html, css, markdown)',
            },
          },
          required: ['path', 'content', 'language'],
        },
      },
    ];

    // Build system prompt
    const systemPrompt = buildSystemPrompt(config);

    // Build user prompt
    const userPrompt = buildUserPrompt(config);

    // Call Claude with tools
    console.log('Calling Claude with tool use...');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      tools,
    });

    // Extract files from tool uses
    const files = [];

    for (const block of message.content) {
      if (block.type === 'tool_use' && block.name === 'create_file') {
        files.push({
          path: block.input.path,
          content: block.input.content,
          language: block.input.language,
          action: 'create',
        });
        console.log(`Created: ${block.input.path}`);
      }
    }

    console.log(`Generated ${files.length} files`);

    // Validate files
    const validation = validateFiles(files, config);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid project structure',
        details: validation.errors,
        files,
      });
    }

    return res.status(200).json({
      success: true,
      files,
      fileCount: files.length,
    });

  } catch (error) {
    console.error('Generation error:', error);
    return res.status(500).json({
      error: 'Project generation failed',
      message: error.message,
    });
  }
};

/**
 * Build system prompt
 */
function buildSystemPrompt(config) {
  const ts = config.typescript;

  return `You are an expert full-stack developer creating production-ready projects.

You have access to the create_file tool. Use it to create EVERY file needed.

CRITICAL REQUIREMENTS:

1. **index.html** - Root HTML file
   <script type="module" src="/src/main.${ts ? 'tsx' : 'jsx'}"></script>
   Note: MUST have leading slash (/)

2. **package.json** - Complete dependencies
   {
     "name": "project",
     "version": "1.0.0",
     "scripts": {
       "dev": "vite",
       "build": "${ts ? 'tsc && ' : ''}vite build",
       "preview": "vite preview"
     },
     "dependencies": {
       "react": "^18.2.0",
       "react-dom": "^18.2.0"
     },
     "devDependencies": {
       "@vitejs/plugin-react": "^4.2.0",
       "vite": "^5.0.0"${ts ? ',\n       "typescript": "^5.0.0",\n       "@types/react": "^18.2.0",\n       "@types/react-dom": "^18.2.0"' : ''}
     }
   }

3. **vite.config.${ts ? 'ts' : 'js'}** - Vite configuration
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'
   export default defineConfig({ plugins: [react()] })

${ts ? `4. **tsconfig.json** - TypeScript configuration
   {
     "compilerOptions": {
       "target": "ES2020",
       "lib": ["ES2020", "DOM", "DOM.Iterable"],
       "module": "ESNext",
       "jsx": "react-jsx",
       "strict": true,
       "moduleResolution": "bundler",
       "resolveJsonModule": true,
       "isolatedModules": true,
       "noEmit": true,
       "skipLibCheck": true
     },
     "include": ["src"]
   }` : ''}

5. **src/main.${ts ? 'tsx' : 'jsx'}** - Entry point
   import React from 'react'
   import ReactDOM from 'react-dom/client'
   import App from './App'
   import './index.css'
   ReactDOM.createRoot(document.getElementById('root')${ts ? '!' : ''}).render(<App />)

6. **src/index.css** - REQUIRED global styles

7. **All React components:**
   - MUST import React
   - MUST export default
   - MUST have proper types if TypeScript

8. **ONLY import files you create**
   - If you import './Button.tsx', you MUST create src/components/Button.tsx

Call create_file for each file. Start with package.json, then index.html, then source files.`;
}

/**
 * Build user prompt
 */
function buildUserPrompt(config) {
  return `Create a ${config.template} project:

Description: ${config.description}

Technical Requirements:
- Framework: ${config.framework}
- Styling: ${config.styling}
- TypeScript: ${config.typescript ? 'Yes' : 'No'}
${config.tests ? '- Include test files' : ''}
${config.git ? '- Include .gitignore' : ''}

Use create_file to generate a complete, buildable project (minimum 8-12 files).

Start now - call create_file multiple times.`;
}

/**
 * Validate generated files
 */
function validateFiles(files, config) {
  const errors = [];
  const filePaths = files.map(f => f.path);

  // Check required files
  const required = [
    'package.json',
    'index.html',
    `vite.config.${config.typescript ? 'ts' : 'js'}`,
    `src/main.${config.typescript ? 'tsx' : 'jsx'}`,
    `src/App.${config.typescript ? 'tsx' : 'jsx'}`,
    'src/index.css',
  ];

  if (config.typescript) {
    required.push('tsconfig.json');
  }

  for (const req of required) {
    if (!filePaths.includes(req)) {
      errors.push(`Missing required file: ${req}`);
    }
  }

  // Check package.json has React deps
  const packageJson = files.find(f => f.path === 'package.json');
  if (packageJson) {
    try {
      const pkg = JSON.parse(packageJson.content);
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (!allDeps.react) errors.push('Missing React dependency');
      if (!allDeps['react-dom']) errors.push('Missing React DOM dependency');
      if (!allDeps.vite) errors.push('Missing Vite dependency');
    } catch (e) {
      errors.push('Invalid package.json format');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
