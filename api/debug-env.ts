export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const apiKey = process.env.AGENT_API_KEY || process.env.VITE_AGENT_API_KEY || '';

  // Show partial key for debugging (first 4 and last 4 chars only - safe to expose)
  const maskedKey = apiKey.length > 8 
    ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` 
    : '(too short)';

  // Test IAM token generation
  let iamResult: any = { status: 'not_tested' };
  try {
    const response = await fetch('https://iam.cloud.ibm.com/identity/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${apiKey}`,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      iamResult = { 
        status: 'failed', 
        httpStatus: response.status, 
        statusText: response.statusText,
        errorBody: errorBody.substring(0, 500)
      };
    } else {
      const data = await response.json();
      iamResult = { 
        status: 'success', 
        tokenType: data.token_type,
        expiresIn: data.expires_in
      };
    }
  } catch (err: any) {
    iamResult = { status: 'error', message: err.message };
  }

  return res.status(200).json({
    AGENT_API_KEY_present: !!apiKey,
    AGENT_API_KEY_length: apiKey.length,
    AGENT_API_KEY_masked: maskedKey,
    AGENT_API_KEY_hasWhitespace: apiKey !== apiKey.trim(),
    AGENT_API_KEY_hasQuotes: apiKey.includes('"') || apiKey.includes("'"),
    AGENT_API_URL: process.env.AGENT_API_URL || process.env.VITE_AGENT_API_URL || '(missing)',
    AGENT_ID: process.env.AGENT_ID || process.env.VITE_AGENT_ID || '(missing)',
    iamTokenTest: iamResult,
  });
}
