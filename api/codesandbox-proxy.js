/**
 * CodeSandbox Proxy API
 * Vercel Serverless Function
 *
 * Creates a CodeSandbox and returns the EMBED URL for WebView preview
 * This allows the mobile app to show the preview INSIDE the app, not in external browser
 *
 * Deploy: vercel deploy
 * Endpoint: https://your-app.vercel.app/api/codesandbox-proxy
 */

module.exports = async function handler(req, res) {
  // Enable CORS for mobile app
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { files, projectName, config } = req.body;

    if (!files || !projectName) {
      return res.status(400).json({
        error: 'Missing required fields: files and projectName'
      });
    }

    console.log(`Creating CodeSandbox for project: ${projectName}`);
    console.log(`Files count: ${files.length}`);

    // Format files for CodeSandbox
    const sandboxFiles = {};
    files.forEach(file => {
      sandboxFiles[file.path] = {
        content: file.content,
        isBinary: false
      };
    });

    // Ensure package.json exists
    if (!sandboxFiles['package.json']) {
      sandboxFiles['package.json'] = {
        content: JSON.stringify({
          name: projectName.toLowerCase().replace(/\s+/g, '-'),
          version: '1.0.0',
          description: config?.description || 'Generated with IDEphone',
          main: 'index.js',
          scripts: {
            start: 'react-scripts start',
            build: 'react-scripts build',
            dev: 'vite',
          },
          dependencies: {
            react: '^18.2.0',
            'react-dom': '^18.2.0',
            vite: '^5.0.0',
            '@vitejs/plugin-react': '^4.2.0',
          },
        }, null, 2),
        isBinary: false
      };
    }

    // Ensure index.html exists
    if (!sandboxFiles['index.html'] && !sandboxFiles['public/index.html']) {
      sandboxFiles['index.html'] = {
        content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
        isBinary: false
      };
    }

    // Create CodeSandbox parameters
    const parameters = {
      files: sandboxFiles
    };

    // Encode to base64
    const parametersJson = JSON.stringify(parameters);
    const parametersBase64 = Buffer.from(parametersJson).toString('base64');

    // POST to CodeSandbox
    const codesandboxUrl = 'https://codesandbox.io/api/v1/sandboxes/define';
    const formData = new URLSearchParams();
    formData.append('parameters', parametersBase64);
    formData.append('json', '1');

    console.log('Sending request to CodeSandbox...');

    const response = await fetch(codesandboxUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('CodeSandbox error:', errorText);
      return res.status(response.status).json({
        error: 'CodeSandbox API error',
        details: errorText
      });
    }

    const data = await response.json();

    console.log('CodeSandbox created:', data.sandbox_id);

    // Return multiple URLs for different use cases
    return res.status(200).json({
      success: true,
      sandboxId: data.sandbox_id,

      // For WebView embed (INSIDE the app - this is what we want!)
      embedUrl: `https://codesandbox.io/embed/${data.sandbox_id}?view=preview&hidenavigation=1&hidedevtools=1&codemirror=1`,

      // For split view (code + preview)
      embedSplitUrl: `https://codesandbox.io/embed/${data.sandbox_id}?view=split&hidenavigation=1`,

      // For external browser (if needed)
      sandboxUrl: `https://codesandbox.io/s/${data.sandbox_id}`,
      editorUrl: `https://codesandbox.io/s/${data.sandbox_id}?file=/src/App.jsx`,
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};
