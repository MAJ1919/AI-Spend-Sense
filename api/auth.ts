import { neon } from '@neondatabase/serverless';

export default async function handler(req: any, res: any) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return res.status(500).json({ error: 'DATABASE_URL environment variable is missing.' });
  }

  const sql = neon(databaseUrl);

  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method ${req.method} not allowed.` });
  }

  try {
    const { action, username, password } = req.body;

    if (!action || !username || !password) {
      return res.status(400).json({ error: 'Missing required fields: action, username, password.' });
    }

    if (action === 'register') {
      // Check if user exists
      const existing = await sql`SELECT * FROM users WHERE username = ${username}`;
      if (existing.length > 0) {
        return res.status(409).json({ error: 'Username already exists.' });
      }

      // Very simple hashing for MVP: base64 encode the password
      // In production, use bcrypt or argon2
      const passwordHash = btoa(password);
      const userId = 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

      await sql`
        INSERT INTO users (id, username, password_hash)
        VALUES (${userId}, ${username}, ${passwordHash})
      `;

      return res.status(201).json({ user: { id: userId, username } });
    }

    if (action === 'login') {
      const users = await sql`SELECT * FROM users WHERE username = ${username}`;
      if (users.length === 0) {
        return res.status(401).json({ error: 'Invalid username or password.' });
      }

      const user = users[0];
      const passwordHash = btoa(password);

      if (user.password_hash !== passwordHash) {
        return res.status(401).json({ error: 'Invalid username or password.' });
      }

      return res.status(200).json({ user: { id: user.id, username: user.username } });
    }

    return res.status(400).json({ error: 'Invalid action. Must be register or login.' });

  } catch (error: any) {
    console.error('Auth serverless error:', error);
    // Let's add a special error message if the table doesn't exist
    if (error.message && error.message.includes('relation "users" does not exist')) {
       return res.status(500).json({ error: 'Database tables not created yet.', needsSetup: true });
    }
    return res.status(500).json({ error: 'Auth operation failed.', details: error.message || error });
  }
}
