import { neon } from '@neondatabase/serverless';

export default async function handler(req: any, res: any) {
  // Enable CORS
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

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return res.status(500).json({ error: 'DATABASE_URL environment variable is missing.' });
  }

  const sql = neon(databaseUrl);

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

    // Create index on user_id for faster queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)
    `;

    return res.status(200).json({ 
      success: true, 
      message: 'Database tables created successfully (users, transactions).' 
    });

  } catch (error: any) {
    console.error('Database setup error:', error);
    return res.status(500).json({ 
      error: 'Failed to set up database tables.', 
      details: error.message || error 
    });
  }
}
