import { withApiSetup } from './_middleware';
import type { NeonQueryFunction } from '@neondatabase/serverless';

export default withApiSetup(async (_req: any, res: any, sql: NeonQueryFunction<any, any>) => {
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create transactions table
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        date TEXT NOT NULL,
        merchant TEXT NOT NULL,
        amount NUMERIC(12,2) NOT NULL,
        category TEXT NOT NULL,
        source TEXT DEFAULT 'manual',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create subscriptions table
    await sql`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        amount NUMERIC(12,2) NOT NULL,
        status TEXT DEFAULT 'active',
        last_payment_date TEXT,
        category TEXT NOT NULL,
        icon_type TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create index on user_id for faster queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id)
    `;

    return res.status(200).json({ 
      success: true, 
      message: 'Database tables created successfully (users, transactions, subscriptions).' 
    });

  } catch (error: unknown) {
    console.error('Database setup error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ 
      error: 'Failed to set up database tables.', 
      details: message 
    });
  }
});
