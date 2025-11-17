/**
 * Test endpoint to verify environment variables
 * Call this to check if ANTHROPIC_API_KEY is loaded
 */

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  return res.status(200).json({
    hasApiKey: !!apiKey,
    keyPrefix: apiKey ? `${apiKey.substring(0, 12)}...` : 'NOT_FOUND',
    keyLength: apiKey ? apiKey.length : 0,
    allEnvKeys: Object.keys(process.env).filter(k =>
      k.includes('ANTHROPIC') || k.includes('VERCEL')
    ),
    nodeEnv: process.env.NODE_ENV,
  });
};
