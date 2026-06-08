import { withApiSetup } from './_middleware';
import type { NeonQueryFunction } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default withApiSetup(async (req: any, res: any, sql: NeonQueryFunction<any, any>) => {
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
      const existing = (await sql`SELECT * FROM users WHERE username = ${username}`) as any[];
      if (existing.length > 0) {
        return res.status(409).json({ error: 'Username already exists.' });
      }

      const passwordHash = bcrypt.hashSync(password, 10);
      const userId = 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

      await sql`
        INSERT INTO users (id, username, password_hash)
        VALUES (${userId}, ${username}, ${passwordHash})
      `;

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) return res.status(500).json({ error: 'JWT_SECRET environment variable is missing.' });
      const token = jwt.sign({ id: userId, username }, jwtSecret, { expiresIn: '7d' });
      return res.status(201).json({ user: { id: userId, username, token } });
    }

    if (action === 'login') {
      const users = (await sql`SELECT * FROM users WHERE username = ${username}`) as any[];
      if (users.length === 0) {
        return res.status(401).json({ error: 'Invalid username or password.' });
      }

      const user = users[0];
      
      let isValid = false;
      try {
        if (user.password_hash && (user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2y$'))) {
          isValid = bcrypt.compareSync(password, user.password_hash);
        }
      } catch (err) {
        console.error('Bcrypt compare failed:', err);
      }

      if (!isValid) {
        // Fallback check for old base64 passwords (so user isn't immediately locked out if testing)
        if (user.password_hash === btoa(password)) {
          // It's a legacy Base64 password. Rehash it securely for the future.
          const newHash = bcrypt.hashSync(password, 10);
          await sql`UPDATE users SET password_hash = ${newHash} WHERE id = ${user.id}`;
        } else {
          return res.status(401).json({ error: 'Invalid username or password.' });
        }
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) return res.status(500).json({ error: 'JWT_SECRET environment variable is missing.' });
      const token = jwt.sign({ id: user.id, username: user.username }, jwtSecret, { expiresIn: '7d' });
      return res.status(200).json({ user: { id: user.id, username: user.username, token } });
    }

    return res.status(400).json({ error: 'Invalid action. Must be register or login.' });

  } catch (error: unknown) {
    console.error('Auth serverless error:', error);
    const message = error instanceof Error ? error.message : String(error);
    // Let's add a special error message if the table doesn't exist
    if (message.includes('relation "users" does not exist')) {
       return res.status(500).json({ error: 'Database tables not created yet.', needsSetup: true });
    }
    return res.status(500).json({ error: 'Auth operation failed.', details: message });
  }
});
