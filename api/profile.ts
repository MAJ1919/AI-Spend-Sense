import { neon } from '@neondatabase/serverless';

export default async function handler(req: any, res: any) {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    return res.status(500).json({ error: 'DATABASE_URL environment variable is missing.' });
  }

  const sql = neon(databaseUrl);

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

  try {
    // 1. GET: fetch the user's profile (null if not created yet)
    if (req.method === 'GET') {
      const { userId } = req.query || {};
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized. Missing userId.' });
      }

      const rows = await sql`SELECT * FROM profiles WHERE user_id = ${userId}`;
      if (rows.length === 0) {
        return res.status(200).json({ profile: null });
      }

      const row = rows[0];
      return res.status(200).json({
        profile: {
          name: row.name ?? '',
          income: Number(row.income),
          budgets: row.budgets ?? {},
          language: row.language ?? 'ar',
          notifications: row.notifications ?? { weekly: true, anomalies: true },
          onboarded: row.onboarded ?? false,
        },
      });
    }

    // 2. POST: upsert the user's profile
    if (req.method === 'POST') {
      const { userId, name, income, budgets, language, notifications, onboarded } = req.body || {};
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized. Missing userId.' });
      }

      await sql`
        INSERT INTO profiles (user_id, name, income, budgets, language, notifications, onboarded, updated_at)
        VALUES (
          ${userId},
          ${name ?? ''},
          ${income ?? 8000},
          ${JSON.stringify(budgets ?? {})},
          ${language ?? 'ar'},
          ${JSON.stringify(notifications ?? { weekly: true, anomalies: true })},
          ${onboarded ?? false},
          NOW()
        )
        ON CONFLICT (user_id) DO UPDATE
        SET name = EXCLUDED.name,
            income = EXCLUDED.income,
            budgets = EXCLUDED.budgets,
            language = EXCLUDED.language,
            notifications = EXCLUDED.notifications,
            onboarded = EXCLUDED.onboarded,
            updated_at = NOW()
      `;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: `Method ${req.method} not allowed.` });

  } catch (error: any) {
    console.error('Profile serverless error:', error);
    if (error.message && error.message.includes('relation "profiles" does not exist')) {
      return res.status(500).json({ error: 'Database tables not created yet.', needsSetup: true });
    }
    return res.status(500).json({ error: 'Profile operation failed.', details: error.message || error });
  }
}
