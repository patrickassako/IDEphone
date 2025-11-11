/**
 * Vercel Deployment API
 * Deploys user-generated projects to Vercel
 *
 * This is like Lovable.dev - each project gets its own Vercel URL!
 *
 * Flow:
 * 1. Mobile app sends project files
 * 2. This backend deploys to Vercel
 * 3. Returns permanent URL: https://my-todo-app-xyz.vercel.app
 * 4. User can update the same deployment
 *
 * Deploy: vercel deploy
 * Endpoint: https://your-app.vercel.app/api/deploy-to-vercel
 */

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
    const { files, projectName, deploymentId } = req.body;

    if (!files || !projectName) {
      return res.status(400).json({
        error: 'Missing required fields: files and projectName'
      });
    }

    console.log(`Deploying project: ${projectName}`);
    console.log(`Files count: ${files.length}`);
    console.log(`Is update: ${!!deploymentId}`);

    // Get Vercel token from environment
    const VERCEL_TOKEN = process.env.VERCEL_TOKEN;

    if (!VERCEL_TOKEN) {
      return res.status(500).json({
        error: 'Server configuration error: VERCEL_TOKEN not set',
        details: 'Please add VERCEL_TOKEN to your Vercel project environment variables'
      });
    }

    // Format files for Vercel deployment
    const vercelFiles = files.map(file => ({
      file: file.path,
      data: file.content,
      encoding: 'utf-8'
    }));

    // Create deployment payload
    const deploymentPayload = {
      name: projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      files: vercelFiles,
      projectSettings: {
        framework: 'vite', // Vercel auto-detects, but we can hint
        buildCommand: 'npm install && npm run build',
        outputDirectory: 'dist',
        installCommand: 'npm install'
      },
      target: 'production'
    };

    console.log('Sending deployment to Vercel...');

    // Deploy to Vercel
    const deploymentResponse = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(deploymentPayload)
    });

    if (!deploymentResponse.ok) {
      const errorText = await deploymentResponse.text();
      console.error('Vercel deployment error:', errorText);
      return res.status(deploymentResponse.status).json({
        error: 'Vercel deployment failed',
        details: errorText
      });
    }

    const deployment = await deploymentResponse.json();

    console.log('Deployment created:', deployment.id);
    console.log('URL:', deployment.url);

    // Wait for deployment to be ready (optional - can return immediately)
    // Vercel deployments are usually ready in 30-60 seconds

    return res.status(200).json({
      success: true,
      deploymentId: deployment.id,
      url: `https://${deployment.url}`,

      // Also return alias URL if project has custom domain
      inspectorUrl: deployment.inspectorUrl,

      // Status can be: BUILDING, READY, ERROR, CANCELED
      status: deployment.readyState || 'BUILDING',

      // User can check this URL to see build progress
      buildUrl: `https://vercel.com/${deployment.creator?.username}/${projectName}/${deployment.id}`
    });

  } catch (error) {
    console.error('Deployment error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};
