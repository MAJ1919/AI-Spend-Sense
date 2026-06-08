import { neon, NeonQueryFunction } from '@neondatabase/serverless';

export function withApiSetup(
  handler: (req: any, res: any, sql: NeonQueryFunction<any, any>) => Promise<any>
) {
  return async (req: any, res: any) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ error: 'JWT_SECRET environment variable is missing.' });
    }

    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const jwt = await import('jsonwebtoken');
        req.user = jwt.verify(token, jwtSecret);
      } catch (err) {
        // Invalid token - don't throw, just let req.user be undefined.
        // Protected endpoints should check if req.user exists.
      }
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return res.status(500).json({ error: 'DATABASE_URL environment variable is missing.' });
    }

    const sql = neon(databaseUrl);

    try {
      return await handler(req, res, sql);
    } catch (error: unknown) {
      console.error('Serverless API Error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: 'Internal Server Error', details: message });
    }
  };
}
