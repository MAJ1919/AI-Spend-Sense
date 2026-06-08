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

import { withApiSetup } from './_middleware';
import type { NeonQueryFunction } from '@neondatabase/serverless';

export default withApiSetup(async (req: any, res: any, sql: NeonQueryFunction<any, any>) => {
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

  // Trim to defend against a trailing \r from CRLF .env files on Windows, which
  // otherwise corrupts the IAM token request -> 400 "Bad Request".
  const apiKey = (process.env.AGENT_API_KEY)?.trim();
  const instanceUrl = (process.env.AGENT_API_URL)?.trim();
  const agentId = (process.env.AGENT_ID)?.trim();

  if (!apiKey || !instanceUrl || !agentId) {
    console.error('Missing Watson config. AGENT_API_KEY:', !!apiKey, 'AGENT_API_URL:', !!instanceUrl, 'AGENT_ID:', !!agentId);
    return res.status(500).json({ error: 'Missing Watson configuration variables in environment.' });
  }

  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized. Must be logged in to chat.' });
    }
    
    // Accept either the new format (messages array) or legacy format (single message string)
    const { messages: clientMessages, message: legacyMessage, sessionId } = req.body;

    // Build the messages array for Watson
    let conversationMessages: { role: string; content: string }[] = [];

    if (Array.isArray(clientMessages) && clientMessages.length > 0) {
      // New format: full conversation history from the frontend
      conversationMessages = clientMessages;
    } else if (legacyMessage) {
      // Legacy format: single message string (backward compatibility)
      conversationMessages = [{ role: 'user', content: legacyMessage }];
    } else {
      return res.status(400).json({ error: 'Missing parameter: messages or message' });
    }

    // 1. Fetch valid IAM Token
    const iamToken = await getIamToken(apiKey);

    // 2. Relay request to Watson Orchestrate Agent Chat Endpoint
    const baseUrl = instanceUrl.replace(/\/+$/, '');
    const targetUrl = `${baseUrl}/v1/orchestrate/${agentId}/chat/completions`;

    // Fetch DB transactions to provide as context to the Orchestrator
    let dbContextMessage = '';
    const userId = req.user.id;
    if (userId) {
      try {
        const transactions = await sql`SELECT date, merchant, amount, category FROM transactions WHERE user_id = ${userId} ORDER BY date DESC LIMIT 50`;
        if (transactions.length > 0) {
          dbContextMessage = `System Information: Here are the user's recent transactions from the database for your reference:\n${JSON.stringify(transactions)}`;
        }
      } catch (err) {
        console.error('Failed to fetch user transactions for Watson context:', err);
      }
    }

    const fullMessages = [...conversationMessages];
    if (dbContextMessage) {
      fullMessages.unshift({ role: 'system', content: dbContextMessage });
    }

    const watsonResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${iamToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        messages: fullMessages,
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

  } catch (error: unknown) {
    console.error('Watson Relay Error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: 'Failed to communicate with Watson Orchestrate.', details: message });
  }
});
