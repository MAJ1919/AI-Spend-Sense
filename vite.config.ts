import { defineConfig, loadEnv, type Plugin, type Connect } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'url';
import type { ServerResponse } from 'http';

/**
 * Local dev only: run the Vercel-style serverless functions in `api/` during
 * `npm run dev`. Vite normally serves `api/*.ts` as static modules (the bug that
 * made the Watson chat "connection error"), so requests to `/api/*` never executed.
 * This middleware loads the matching `api/<name>.ts` handler and calls its default
 * export with a minimal (req, res) shim compatible with the Vercel Node signature.
 * On Vercel itself this plugin does nothing — the platform runs the functions natively.
 */
function vercelApiDev(mode: string): Plugin {
  return {
    name: 'vercel-api-dev',
    apply: 'serve', // dev server only
    configureServer(server) {
      // Make .env values visible to the API handlers via process.env
      // (Vite only exposes VITE_-prefixed vars to client code by default).
      const env = loadEnv(mode, process.cwd(), '');
      for (const [key, value] of Object.entries(env)) {
        if (process.env[key] === undefined) process.env[key] = value;
      }

      server.middlewares.use(async (req: Connect.IncomingMessage, res: ServerResponse, next) => {
        const url = req.url || '';
        if (!url.startsWith('/api/')) return next();

        const [pathname, search] = url.split('?');

        try {
          // Load the handler module fresh (HMR-friendly) e.g. /api/watson-chat -> /api/watson-chat.ts
          const mod = await server.ssrLoadModule(`${pathname}.ts`);
          const handler = mod.default;
          if (typeof handler !== 'function') return next();

          // Shim the bits of the Vercel req/res contract the handlers use.
          (req as any).query = Object.fromEntries(new URLSearchParams(search || ''));
          (req as any).body = await readJsonBody(req);

          const r = res as any;
          r.status = (code: number) => { res.statusCode = code; return r; };
          r.json = (obj: unknown) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(obj));
            return r;
          };

          await handler(req, res);
        } catch (err: any) {
          // Surface the real error instead of falling through to the SPA fallback.
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Dev API handler error', details: err?.message || String(err) }));
        }
      });
    },
  };
}

function readJsonBody(req: Connect.IncomingMessage): Promise<unknown> {
  return new Promise((resolve) => {
    if (req.method === 'GET' || req.method === 'HEAD') return resolve(undefined);
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch { resolve(data); }
    });
    req.on('error', () => resolve({}));
  });
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), vercelApiDev(mode)],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
}));
