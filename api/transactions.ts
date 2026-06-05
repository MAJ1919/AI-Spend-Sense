import { neon } from '@neondatabase/serverless';

export default async function handler(req: any, res: any) {
  // Check if DATABASE_URL is configured
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return res.status(500).json({ error: 'DATABASE_URL environment variable is missing.' });
  }

  const sql = neon(databaseUrl);

  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Preflight check
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. GET: Fetch transactions
    if (req.method === 'GET') {
      const { userId } = req.query || {};
      if (!userId) {
         return res.status(401).json({ error: 'Unauthorized. Missing userId.' });
      }

      const result = await sql`
        SELECT * FROM transactions 
        WHERE user_id = ${userId}
        ORDER BY date DESC
      `;
      // Map database row keys to frontend keys if needed (e.g. numeric types to float)
      const mapped = result.map((row: any) => ({
        id: row.id,
        date: row.date ? new Date(row.date).toISOString().split('T')[0] : '',
        merchant: row.merchant,
        amount: parseFloat(row.amount),
        category: row.category,
        source: row.source || 'manual'
      }));
      return res.status(200).json(mapped);
    }

    // 2. POST: Insert transaction
    if (req.method === 'POST') {
      const { id, userId, date, merchant, amount, category, source } = req.body;
      if (!id || !userId || !date || !merchant || amount === undefined || !category) {
        return res.status(400).json({ error: 'Missing required transaction fields.' });
      }

      await sql`
        INSERT INTO transactions (id, user_id, date, merchant, amount, category, source)
        VALUES (${id}, ${userId}, ${date}, ${merchant}, ${amount}, ${category}, ${source || 'manual'})
        ON CONFLICT (id) DO UPDATE 
        SET date = EXCLUDED.date,
            merchant = EXCLUDED.merchant,
            amount = EXCLUDED.amount,
            category = EXCLUDED.category,
            source = EXCLUDED.source
      `;
      return res.status(201).json({ success: true });
    }

    // 3. DELETE: Clear all user transactions
    if (req.method === 'DELETE') {
      const { userId } = req.query || {};
      if (!userId) {
         return res.status(401).json({ error: 'Unauthorized. Missing userId.' });
      }
      await sql`DELETE FROM transactions WHERE user_id = ${userId}`;
      return res.status(200).json({ success: true, message: 'User transactions cleared successfully.' });
    }

    // Unsupported methods
    return res.status(405).json({ error: `Method ${req.method} not allowed.` });

  } catch (error: any) {
    console.error('Serverless database error:', error);
    return res.status(500).json({ 
      error: 'Database operation failed.', 
      details: error.message || error 
    });
  }
}
