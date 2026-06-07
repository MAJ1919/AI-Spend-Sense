export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Only show whether variables exist (true/false), never reveal actual values
  return res.status(200).json({
    AGENT_API_KEY: !!process.env.AGENT_API_KEY,
    AGENT_API_URL: !!process.env.AGENT_API_URL,
    AGENT_ID: !!process.env.AGENT_ID,
    DATABASE_URL: !!process.env.DATABASE_URL,
    // Show the actual variable names in env (filtered to AGENT_ and DATABASE_ prefixes only)
    envKeysContainingAgent: Object.keys(process.env).filter(k => k.toUpperCase().includes('AGENT')),
    envKeysContainingDatabase: Object.keys(process.env).filter(k => k.toUpperCase().includes('DATABASE')),
  });
}
