/**
 * Project Validation Service
 * Uses AI to scan projects for errors and suggest/apply fixes
 */

import { AIService } from './ai/AIService';
import { FileSystemService } from './FileSystemService';
import { ProjectValidationError } from '../types';
import { GeneratedFile } from './ai/MultiFileGenerator';

export interface ValidationResult {
  isValid: boolean;
  errors: ProjectValidationError[];
  warnings: ProjectValidationError[];
  fixes?: Map<string, string>; // filePath -> fixedContent
}

export class ProjectValidationService {
  /**
   * Scan a project for errors using AI
   */
  static async scanProject(
    projectPath: string,
    files: GeneratedFile[]
  ): Promise<ValidationResult> {
    console.log(`🔍 Scanning project: ${projectPath}`);

    try {
      // Build file summary for AI
      const fileSummary = files.map(f => `${f.path} (${f.content.length} chars)`).join('\n');

      // Create AI prompt for validation
      const prompt = `You are a code quality expert. Analyze this project for errors that would prevent deployment to Vercel.

PROJECT FILES:
${fileSummary}

FILE CONTENTS:
${files.map(f => `
=== ${f.path} ===
${f.content}
`).join('\n')}

ANALYZE FOR:
1. Missing dependencies in package.json
2. TypeScript configuration errors (missing jsx, wrong lib, etc.)
3. Missing required files (index.html, vite.config, etc.)
4. Import errors (importing non-existent files)
5. Missing React imports in components
6. Missing exports

RESPOND IN THIS FORMAT:
\`\`\`json
{
  "errors": [
    {
      "file": "src/App.tsx",
      "line": 1,
      "message": "Cannot find module 'react'",
      "severity": "error",
      "suggestedFix": "Add 'react' to package.json dependencies"
    }
  ],
  "warnings": [],
  "isValid": false
}
\`\`\`

IMPORTANT: Only respond with the JSON, nothing else.`;

      const response = await AIService.generateResponse(prompt, {
        fileName: 'validation',
        fileContent: '',
        messages: [],
      });

      // Parse AI response
      const jsonMatch = response.content.match(/```json\n([\s\S]*?)\n```/);
      if (!jsonMatch) {
        console.error('Invalid AI response format');
        return {
          isValid: true,
          errors: [],
          warnings: [],
        };
      }

      const result = JSON.parse(jsonMatch[1]);

      console.log(`✅ Scan complete: ${result.errors.length} errors, ${result.warnings.length} warnings`);

      return {
        isValid: result.isValid,
        errors: result.errors || [],
        warnings: result.warnings || [],
      };
    } catch (error) {
      console.error('Error scanning project:', error);
      return {
        isValid: true, // Don't block deployment on scan error
        errors: [],
        warnings: [],
      };
    }
  }

  /**
   * Fix errors automatically using AI
   */
  static async fixErrors(
    files: GeneratedFile[],
    errors: ProjectValidationError[]
  ): Promise<Map<string, string>> {
    console.log(`🔧 Fixing ${errors.length} errors...`);

    const fixes = new Map<string, string>();

    try {
      // Group errors by file
      const errorsByFile = errors.reduce((acc, error) => {
        if (!acc[error.file]) {
          acc[error.file] = [];
        }
        acc[error.file].push(error);
        return acc;
      }, {} as Record<string, ProjectValidationError[]>);

      // Fix each file
      for (const [filePath, fileErrors] of Object.entries(errorsByFile)) {
        const file = files.find(f => f.path === filePath);
        if (!file) continue;

        const prompt = `You are a code fixer. Fix the following errors in this file:

FILE: ${filePath}
CONTENT:
${file.content}

ERRORS TO FIX:
${fileErrors.map(e => `- Line ${e.line}: ${e.message}`).join('\n')}

RESPOND WITH THE FIXED CODE ONLY, no explanations. Use this format:
\`\`\`${file.language}
fixed code here
\`\`\``;

        const response = await AIService.generateResponse(prompt, {
          fileName: filePath,
          fileContent: file.content,
          messages: [],
        });

        // Extract fixed code
        const codeMatch = response.content.match(/```[\w]*\n([\s\S]*?)\n```/);
        if (codeMatch) {
          fixes.set(filePath, codeMatch[1]);
          console.log(`✅ Fixed ${filePath}`);
        }
      }

      return fixes;
    } catch (error) {
      console.error('Error fixing errors:', error);
      return fixes;
    }
  }

  /**
   * Quick validation without AI (faster, basic checks)
   */
  static quickValidate(files: GeneratedFile[]): ValidationResult {
    const errors: ProjectValidationError[] = [];
    const warnings: ProjectValidationError[] = [];

    // Check for required files
    const hasPackageJson = files.some(f => f.path === 'package.json');
    const hasIndexHtml = files.some(f => f.path === 'index.html');
    const hasViteConfig = files.some(f => f.path.startsWith('vite.config.'));

    if (!hasPackageJson) {
      errors.push({
        file: 'package.json',
        message: 'Missing package.json file',
        severity: 'error',
      });
    }

    if (!hasIndexHtml) {
      errors.push({
        file: 'index.html',
        message: 'Missing index.html file',
        severity: 'error',
      });
    }

    if (!hasViteConfig) {
      warnings.push({
        file: 'vite.config.js',
        message: 'Missing vite.config file (recommended)',
        severity: 'warning',
      });
    }

    // Check package.json has React dependencies
    const packageJson = files.find(f => f.path === 'package.json');
    if (packageJson) {
      try {
        const pkg = JSON.parse(packageJson.content);
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

        if (!allDeps['react']) {
          errors.push({
            file: 'package.json',
            message: 'Missing React dependency',
            severity: 'error',
            suggestedFix: 'Add "react": "^18.2.0" to dependencies',
          });
        }

        if (!allDeps['react-dom']) {
          errors.push({
            file: 'package.json',
            message: 'Missing React DOM dependency',
            severity: 'error',
            suggestedFix: 'Add "react-dom": "^18.2.0" to dependencies',
          });
        }

        if (!allDeps['vite']) {
          errors.push({
            file: 'package.json',
            message: 'Missing Vite dependency',
            severity: 'error',
            suggestedFix: 'Add "vite": "^5.0.0" to devDependencies',
          });
        }
      } catch (e) {
        errors.push({
          file: 'package.json',
          message: 'Invalid JSON format',
          severity: 'error',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
