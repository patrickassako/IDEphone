/**
 * Vercel Deployment Service
 * Deploys user projects to Vercel for live testing
 * Like Lovable.dev - each project gets its own permanent URL
 */

import { GeneratedFile } from '../ai/MultiFileGenerator';
import { ProjectConfig } from '../../components/ProjectGeneratorModal';

export interface VercelDeployment {
  deploymentId: string;
  url: string;
  status: 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';
  buildUrl?: string;
  inspectorUrl?: string;
}

export class VercelDeploymentService {
  /**
   * Deploy a project to Vercel
   * Returns a permanent URL that can be updated later
   */
  static async deployProject(
    projectName: string,
    files: GeneratedFile[],
    config?: ProjectConfig,
    existingDeploymentId?: string
  ): Promise<VercelDeployment> {
    try {
      console.log(`Deploying ${projectName} to Vercel...`);

      // Get deployment API URL from environment
      const DEPLOYMENT_API_URL =
        process.env.EXPO_PUBLIC_VERCEL_DEPLOYMENT_URL ||
        'https://idephone.vercel.app/api/deploy-to-vercel';

      console.log('Using deployment API:', DEPLOYMENT_API_URL);

      // Send deployment request
      const response = await fetch(DEPLOYMENT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files,
          projectName,
          deploymentId: existingDeploymentId, // For updates
          config,
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = `Deployment failed (${response.status})`;

        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;

          if (errorData.details) {
            console.error('Deployment error details:', errorData.details);
          }
        } else {
          const textResponse = await response.text();
          console.error('Deployment response:', textResponse);

          if (response.status === 404) {
            throw new Error(
              'Deployment backend not found!\n\n' +
                'Please deploy the Vercel backend first:\n' +
                '1. vercel deploy --prod\n' +
                '2. Add VERCEL_TOKEN to environment variables\n' +
                '3. Update .env with deployment URL\n\n' +
                'See DEPLOY_BACKEND.md for details.'
            );
          }
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      console.log('Deployment successful!');
      console.log('URL:', data.url);
      console.log('Status:', data.status);

      return {
        deploymentId: data.deploymentId,
        url: data.url,
        status: data.status,
        buildUrl: data.buildUrl,
        inspectorUrl: data.inspectorUrl,
      };
    } catch (error: any) {
      console.error('Deployment error:', error);
      throw error;
    }
  }

  /**
   * Check deployment status
   * Useful to poll until deployment is READY
   */
  static async checkDeploymentStatus(
    deploymentId: string
  ): Promise<'BUILDING' | 'READY' | 'ERROR' | 'CANCELED'> {
    // This would call Vercel API to check status
    // For now, we'll implement this later if needed
    // Most deployments are ready in 30-60 seconds
    return 'BUILDING';
  }

  /**
   * Update existing deployment with new files
   * This creates a new deployment but keeps the same project
   */
  static async updateDeployment(
    projectName: string,
    files: GeneratedFile[],
    existingDeploymentId: string,
    config?: ProjectConfig
  ): Promise<VercelDeployment> {
    return this.deployProject(projectName, files, config, existingDeploymentId);
  }
}
