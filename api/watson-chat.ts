import { neon } from '@neondatabase/serverless';

// Cache the token in memory to avoid generating a new token for every single message
let cachedToken: string | null = null;
let tokenExpiryTime = 0;

async function getIamToken(apiKey: string): Promise<string> {
  const currentTime = Date.now();

  // Return cached token if still valid (minus 2 minutes buffer)
  if (cachedToken && currentTime < tokenExpiryTime - 120000) {
    return cachedToken;
  }

  const response = await fetch('https://iam.cloud.ibm.com/identity/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${apiKey}`,
  });

  if (!response.ok) {
    throw new Error(`Failed to generate IAM Token: ${response.statusText}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiryTime = currentTime + (data.expires_in * 1000);

  return cachedToken!;
}

export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method ${req.method} not allowed.` });
  }

  const apiKey = process.env.AGENT_API_KEY;
  const instanceUrl = process.env.AGENT_API_URL;
  const agentId = process.env.AGENT_ID;
  const workspaceId = process.env.WORKSPACE_ID;

  if (!apiKey || !instanceUrl || !agentId || !workspaceId) {
    return res.status(500).json({ error: 'Missing Watson configuration variables in environment.' });
  }

  try {
    const { message, sessionId } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Missing parameter: message' });
    }

    // 1. Fetch valid IAM Token
    const iamToken = await getIamToken(apiKey);

    // 2. Relay request to Watson Orchestrate Agent Chat Endpoint
    const targetUrl = `${instanceUrl}/api/v1/orchestrate/${agentId}/chat/completions`;

    const watsonResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${iamToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: message
          }
        ],
        session_id: sessionId
      }),
    });

    if (!watsonResponse.ok) {
      const errorText = await watsonResponse.text();
      return res.status(watsonResponse.status).json({ 
        error: 'Watson returned an error.', 
        details: errorText 
      });
    }

    const data = await watsonResponse.json();
    return res.status(200).json(data);

  } catch (error: any) {
    console.error('Watson Relay Error:', error);
    return res.status(500).json({ error: 'Failed to communicate with Watson Orchestrate.' });
  }
}
