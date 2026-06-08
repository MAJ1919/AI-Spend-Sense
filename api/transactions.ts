import { withApiSetup } from './_middleware';
import type { NeonQueryFunction } from '@neondatabase/serverless';

export default withApiSetup(async (req: any, res: any, sql: NeonQueryFunction<any, any>) => {
  try {
    // 1. GET: Fetch transactions
    if (req.method === 'GET') {
      if (!req.user || !req.user.id) {
         return res.status(401).json({ error: 'Unauthorized.' });
      }
      const userId = req.user.id;

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

    // 2. POST: Insert transaction(s)
    if (req.method === 'POST') {
      if (!req.user || !req.user.id) {
         return res.status(401).json({ error: 'Unauthorized.' });
      }
      const userId = req.user.id;
      const { transactions, ...singleTx } = req.body;
      
      const txsToInsert = Array.isArray(transactions) 
        ? transactions.map((tx: any) => ({ ...tx, userId })) 
        : [ { ...singleTx, userId } ];

      if (txsToInsert.length === 0 || !txsToInsert[0].id) {
        return res.status(400).json({ error: 'No valid transactions provided.' });
      }

      try {
        await Promise.all(txsToInsert.map((tx: any) => {
          const { id, userId, date, merchant, amount, category, source } = tx;
          if (!id || !userId || !date || !merchant || amount === undefined || !category) {
            throw new Error('Missing required transaction fields.');
          }
          return sql`
            INSERT INTO transactions (id, user_id, date, merchant, amount, category, source)
            VALUES (${id}, ${userId}, ${date}, ${merchant}, ${amount}, ${category}, ${source || 'manual'})
            ON CONFLICT (id) DO UPDATE 
            SET date = EXCLUDED.date,
                merchant = EXCLUDED.merchant,
                amount = EXCLUDED.amount,
                category = EXCLUDED.category,
                source = EXCLUDED.source
          `;
        }));
        return res.status(201).json({ success: true });
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }

    // 3. PUT: Update a single transaction
    if (req.method === 'PUT') {
      if (!req.user || !req.user.id) {
         return res.status(401).json({ error: 'Unauthorized.' });
      }
      const userId = req.user.id;
      const { id, category } = req.body;
      if (!id || !category) {
        return res.status(400).json({ error: 'Missing id or category' });
      }
      await sql`
        UPDATE transactions 
        SET category = ${category}
        WHERE id = ${id} AND user_id = ${userId}
      `;
      return res.status(200).json({ success: true, message: 'Transaction updated successfully.' });
    }

    // 4. DELETE: Clear all user transactions
    if (req.method === 'DELETE') {
      if (!req.user || !req.user.id) {
         return res.status(401).json({ error: 'Unauthorized.' });
      }
      const userId = req.user.id;
      await sql`DELETE FROM transactions WHERE user_id = ${userId}`;
      return res.status(200).json({ success: true, message: 'User transactions cleared successfully.' });
    }

    // Unsupported methods
    return res.status(405).json({ error: `Method ${req.method} not allowed.` });

  } catch (error: unknown) {
    console.error('Serverless database error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ 
      error: 'Database operation failed.', 
      details: message 
    });
  }
});
