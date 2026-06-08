const fs = require('fs');
const envFile = fs.readFileSync('.env', 'utf8');

// Use simple splits instead of regex to avoid parsing issues if needed, but regex works in node file.
const getEnv = (key) => {
  const match = envFile.match(new RegExp(`${key}="?([^"\\n]+)`));
  return match ? match[1].trim() : null;
};

const apiKey = getEnv('AGENT_API_KEY');
const apiUrl = getEnv('AGENT_API_URL');
const agentId = getEnv('AGENT_ID');

if (!apiKey || !apiUrl || !agentId) {
  console.log('Missing env vars');
  process.exit(1);
}

const baseUrl = apiUrl.replace(/\/+$/, '');

async function run() {
  console.log('1. Fetching IAM token...');
  const iamRes = await fetch('https://iam.cloud.ibm.com/identity/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${apiKey}`
  });
  
  if (!iamRes.ok) {
    console.log('IAM Request failed', await iamRes.text());
    return;
  }
  
  const iamData = await iamRes.json();
  const iamToken = iamData.access_token;
  
  const systemInstruction = `You are a helpful financial assistant. If the user provides any new transaction data (like purchases, income, expenses) in their message, you MUST extract them and strictly output them at the end of your response inside a JSON block with the following exact format: [TRANSACTIONS_JSON] [{"date": "YYYY-MM-DD", "merchant": "Name", "amount": 10.5, "category": "Food"}] [/TRANSACTIONS_JSON]. Use today's date if missing.`;
  
  const fullMessages = [
    { role: 'system', content: systemInstruction },
    { role: 'user', content: 'University Cafeteria, 18.00 SAR, Food - 2025-05-18: Jarir Bookstore, 1899.00 SAR, Electronics' }
  ];

  console.log('2. Sending request to Watson Orchestrate...');
  const watsonRes = await fetch(`${baseUrl}/v1/orchestrate/${agentId}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${iamToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      messages: fullMessages,
      stream: false,
      session_id: 'test-session-simulate'
    })
  });
  
  if (!watsonRes.ok) {
    console.log('Watson Request failed', await watsonRes.text());
    return;
  }
  
  const watsonData = await watsonRes.json();
  console.log('3. Watson Response Details:');
  console.log('Message Content:', watsonData.choices?.[0]?.message?.content);
}

run().catch(console.error);
