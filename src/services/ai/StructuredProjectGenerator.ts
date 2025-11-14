/**
 * Structured Project Generator using Claude Tool Use
 * Uses backend API with Claude SDK's function calling for reliable project generation
 */

import { ProjectConfig } from '../../components/ProjectGeneratorModal';
import { GeneratedFile } from './MultiFileGenerator';

export class StructuredProjectGenerator {
  /**
   * Generate project using Claude tool use (via backend)
   */
  static async generateProject(config: ProjectConfig): Promise<GeneratedFile[]> {
    console.log('🤖 Generating project with Claude Tool Use...');

    try {
      // Get backend URL
      const BACKEND_URL =
        process.env.EXPO_PUBLIC_VERCEL_DEPLOYMENT_URL ||
        'https://idephone.vercel.app/api/deploy-to-vercel';

      const endpoint = BACKEND_URL.replace('/deploy-to-vercel', '/generate-project');

      console.log('📡 Calling backend:', endpoint);

      // Call backend API
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Backend error: ${response.status} - ${errorData.error || 'Unknown error'}\n${errorData.details ? JSON.stringify(errorData.details) : ''}`
        );
      }

      const data = await response.json();

      if (!data.success || !data.files) {
        throw new Error('Invalid response from backend');
      }

      console.log(`✅ Generated ${data.files.length} files using tool use`);

      // Log all files
      data.files.forEach((file: GeneratedFile) => {
        console.log(`  ✓ ${file.path} (${file.language})`);
      });

      return data.files;
    } catch (error) {
      console.error('❌ Structured generation failed:', error);
      throw error;
    }
  }
}
