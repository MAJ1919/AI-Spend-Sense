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

// System prompt that instructs Watson to output structured transaction data
const SYSTEM_PROMPT = `You are SpendSense AI, a bilingual (Arabic/English) financial assistant that helps users track their expenses and manage their budgets.

CORE RULES:
1. Always respond in the same language the user is using (Arabic or English).
2. When the user provides expense or transaction information (receipts, bank statements, transaction lists, or individual expenses), you MUST extract each individual transaction and include a structured data block in your response.
3. Use this exact format for the structured block — place it at the END of your response:

[TRANSACTIONS_JSON]
[{"date":"YYYY-MM-DD","merchant":"Store/Merchant Name","amount":123.45,"category":"Food"}]
[/TRANSACTIONS_JSON]

4. Valid categories are: Food, Transport, Entertainment, Subscriptions, Shopping, Electronics, Education, Groceries, Other
5. If the user does not specify a date, use today's date.
6. If a merchant name is unclear or abbreviated, ask the user for clarification BEFORE outputting the transactions block.
7. When the user asks for analysis, reports, budget reviews, or summaries, provide detailed answers based on the full conversation history. Do NOT include the [TRANSACTIONS_JSON] block for analysis/report requests.
8. Always be helpful, concise, and accurate with financial data.
9. When you receive a large batch of transactions, process ALL of them and include every single one in the JSON block — do not omit any.`;

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
  const apiKey = process.env.AGENT_API_KEY || process.env.VITE_AGENT_API_KEY;
  const instanceUrl = process.env.AGENT_API_URL || process.env.VITE_AGENT_API_URL;
  const agentId = process.env.AGENT_ID || process.env.VITE_AGENT_ID;

  if (!apiKey || !instanceUrl || !agentId) {
    console.error('Missing Watson config. AGENT_API_KEY:', !!apiKey, 'AGENT_API_URL:', !!instanceUrl, 'AGENT_ID:', !!agentId);
    return res.status(500).json({ error: 'Missing Watson configuration variables in environment.' });
  }

  try {
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

    // Prepend the system prompt to the conversation history
    const fullMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationMessages
    ];

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

  } catch (error: any) {
    console.error('Watson Relay Error:', error);
    return res.status(500).json({ error: 'Failed to communicate with Watson Orchestrate.', details: error.message });
  }
}
