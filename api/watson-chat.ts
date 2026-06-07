import { neon } from '@neondatabase/serverless';

// Cache the token in memory to avoid generating a new token for every single message
let cachedToken: string | null = null;
let tokenExpiryTime = 0;

// Pull the user's stored transactions + budgets from Neon and format them as a
// CSV/data block so the file-analysis agent can work on real data instead of
// asking the user to upload a file. Best-effort: returns '' if anything is missing.
async function buildUserDataContext(sessionId?: string): Promise<string> {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl || !sessionId) return '';

  try {
    const sql = neon(databaseUrl);
    const txs = await sql`
      SELECT date, merchant, amount, category
      FROM transactions
      WHERE user_id = ${sessionId}
      ORDER BY date DESC
      LIMIT 500
    `;
    if (txs.length === 0) return '';

    const csv = ['date,merchant,amount,category']
      .concat(txs.map((t: any) => `${t.date},${t.merchant},${t.amount},${t.category}`))
      .join('\n');

    const profileRows = await sql`SELECT income, budgets FROM profiles WHERE user_id = ${sessionId}`;
    let budgetLine = '';
    if (profileRows.length > 0) {
      const p = profileRows[0];
      budgetLine = `\nMonthly income: ${p.income}. Category budgets: ${JSON.stringify(p.budgets)}.`;
    }

    return `The user's transaction data is provided below as CSV (do not ask them to upload a file; analyze this data directly).\n\n${csv}\n${budgetLine}`;
  } catch (err) {
    console.error('Failed to load user data context from Neon:', err);
    return '';
  }
}

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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: `Method ${req.method} not allowed.` });
  }

  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: "success", 
      message: "Watson chat API is active and ready.",
      data: []
    });
  }

  // Support both AGENT_* and VITE_AGENT_* env var names
  // (Vercel may have them stored with the VITE_ prefix from frontend config)
  const apiKey = process.env.AGENT_API_KEY || process.env.VITE_AGENT_API_KEY;
  const instanceUrl = process.env.AGENT_API_URL || process.env.VITE_AGENT_API_URL;
  const agentId = process.env.AGENT_ID || process.env.VITE_AGENT_ID;

  if (!apiKey || !instanceUrl || !agentId) {
    console.error('Missing Watson config. AGENT_API_KEY:', !!apiKey, 'AGENT_API_URL:', !!instanceUrl, 'AGENT_ID:', !!agentId);
    return res.status(500).json({ error: 'Missing Watson configuration variables in environment.' });
  }

  try {
    const { message, sessionId } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Missing parameter: message' });
    }

    // 1. Fetch valid IAM Token
    const iamToken = await getIamToken(apiKey);

    // 1b. Enrich the message with the user's stored data so the agent can
    // analyze it directly instead of requesting a file upload.
    // Embed the data in the USER turn (Orchestrate agents often ignore system turns).
    const dataContext = await buildUserDataContext(sessionId);
    const userContent = dataContext ? `${dataContext}\n\nQuestion: ${message}` : message;
    const messages = [{ role: 'user', content: userContent }];

    // 2. Relay request to Watson Orchestrate Agent Chat Endpoint.
    // SaaS path is /v1/orchestrate/<agent>/chat/completions (no /api prefix).
    // Trim any trailing slash on the instance URL so both forms work.
    const baseUrl = instanceUrl.replace(/\/+$/, '');
    const targetUrl = `${baseUrl}/v1/orchestrate/${agentId}/chat/completions`;

    const watsonResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${iamToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        messages,
        stream: false,
        session_id: sessionId
      }),
    });

    if (!watsonResponse.ok) {
      const errorText = await watsonResponse.text();
      console.error('Watson API error:', watsonResponse.status, errorText);
      return res.status(watsonResponse.status).json({ 
        error: 'Watson returned an error.', 
        details: errorText 
      });
    }

    const data = await watsonResponse.json();
    return res.status(200).json(data);

  } catch (error: any) {
    console.error('Watson Relay Error:', error);
    return res.status(500).json({ error: 'Failed to communicate with Watson Orchestrate.', details: error.message });
  }
}
