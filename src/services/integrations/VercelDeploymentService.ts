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

      // Get bypass token for Vercel Deployment Protection
      const bypassToken = process.env.EXPO_PUBLIC_VERCEL_BYPASS_TOKEN;

      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add bypass token if available (for accounts without Pro)
      if (bypassToken) {
        headers['x-vercel-protection-bypass'] = bypassToken;
        console.log('✅ Using Vercel bypass token for authentication');
      }

      // Send deployment request
      let response;
      try {
        response = await fetch(DEPLOYMENT_API_URL, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            files,
            projectName,
            deploymentId: existingDeploymentId, // For updates
            config,
          }),
        });
      } catch (networkError: any) {
        console.error('Network error:', networkError);
        throw new Error(
          'Network connection failed!\n\n' +
          'Could not reach the deployment backend. Possible causes:\n' +
          '1. No internet connection\n' +
          '2. Backend URL is incorrect in .env\n' +
          '3. Firewall blocking the request\n\n' +
          `Trying to reach: ${DEPLOYMENT_API_URL}\n\n` +
          'Check your .env file and internet connection.'
        );
      }

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

          if (response.status === 401) {
            throw new Error(
              '🔒 Vercel Authentication Required!\n\n' +
                'Your Vercel project has Deployment Protection enabled.\n\n' +
                '✅ Solution:\n' +
                '1. Go to: Vercel Dashboard → Your Project → Settings → Deployment Protection\n' +
                '2. Scroll to "Protection Bypass for Automation"\n' +
                '3. Click "Generate Token" and copy it\n' +
                '4. Add to .env: EXPO_PUBLIC_VERCEL_BYPASS_TOKEN=your_token_here\n' +
                '5. Restart the app (npm start)\n\n' +
                'See TROUBLESHOOTING.md for detailed instructions.'
            );
          } else if (response.status === 404) {
            throw new Error(
              'Vercel deployment endpoint not found!\n\n' +
                'Possible causes:\n' +
                '1. Backend not deployed yet\n' +
                '2. Wrong URL in .env file\n' +
                '3. API endpoint path incorrect\n\n' +
                `Current URL: ${DEPLOYMENT_API_URL}\n\n` +
                'To fix:\n' +
                '1. Deploy backend: vercel deploy --prod\n' +
                '2. Add VERCEL_TOKEN to Vercel project settings\n' +
                '3. Update .env with correct URL\n\n' +
                'See DEPLOY_BACKEND.md for full instructions.'
            );
          } else if (response.status >= 500) {
            throw new Error(
              'Backend server error!\n\n' +
                'The backend is deployed but encountered an error. ' +
                'This is usually caused by:\n' +
                '1. Missing VERCEL_TOKEN environment variable\n' +
                '2. Invalid Vercel token\n' +
                '3. Vercel API limits reached\n\n' +
                'Check Vercel logs: vercel logs\n' +
                'Check environment variables in Vercel dashboard.'
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
