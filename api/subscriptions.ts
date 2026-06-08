import { withApiSetup } from './_middleware';
import type { NeonQueryFunction } from '@neondatabase/serverless';

export default withApiSetup(async (req: any, res: any, sql: NeonQueryFunction<any, any>) => {
  try {
    // 1. GET: Fetch subscriptions
    if (req.method === 'GET') {
      if (!req.user || !req.user.id) return res.status(401).json({ error: 'Unauthorized.' });
      const userId = req.user.id;

      const result = await sql`
        SELECT * FROM subscriptions WHERE user_id = ${userId} ORDER BY created_at DESC
      `;
      const mapped = result.map((row: any) => ({
        id: row.id,
        name: row.name,
        amount: parseFloat(row.amount),
        status: row.status,
        lastPaymentDate: row.last_payment_date,
        category: row.category,
        iconType: row.icon_type
      }));
      return res.status(200).json(mapped);
    }

    // 2. POST: Insert or Update subscription
    if (req.method === 'POST') {
      if (!req.user || !req.user.id) return res.status(401).json({ error: 'Unauthorized.' });
      const userId = req.user.id;
      const { id, name, amount, status, lastPaymentDate, category, iconType } = req.body;
      if (!id || !name || amount === undefined) {
        return res.status(400).json({ error: 'Missing required subscription fields.' });
      }

      await sql`
        INSERT INTO subscriptions (id, user_id, name, amount, status, last_payment_date, category, icon_type)
        VALUES (${id}, ${userId}, ${name}, ${amount}, ${status || 'active'}, ${lastPaymentDate || null}, ${category || 'Subscriptions'}, ${iconType || 'credit-card'})
        ON CONFLICT (id) DO UPDATE 
        SET name = EXCLUDED.name,
            amount = EXCLUDED.amount,
            status = EXCLUDED.status,
            last_payment_date = EXCLUDED.last_payment_date,
            category = EXCLUDED.category,
            icon_type = EXCLUDED.icon_type
      `;
      return res.status(201).json({ success: true });
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
