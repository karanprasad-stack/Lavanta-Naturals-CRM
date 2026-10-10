import { config } from './env.js';

export const isAllowedOrigin = (origin?: string): boolean => {
  if (!origin) return true; // Allow mobile apps, Postman, curl, server-to-server

  const normalizedOrigin = origin.trim().replace(/\/+$/, '');

  // 1. Configured CLIENT_URL (supports comma-separated multiple URLs)
  const allowedUrls = (config.clientUrl || '')
    .split(',')
    .map(u => u.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  if (allowedUrls.includes(normalizedOrigin)) {
    return true;
  }

  // 2. Localhost development
  if (
    normalizedOrigin.startsWith('http://localhost:') ||
    normalizedOrigin.startsWith('http://127.0.0.1:') ||
    normalizedOrigin === 'http://localhost' ||
    normalizedOrigin === 'http://127.0.0.1'
  ) {
    return true;
  }

  // 3. Vercel deployments (production domain & all preview branch deployments)
  if (/^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(normalizedOrigin)) {
    return true;
  }

  // 4. Render frontend deployments (if applicable)
  if (/^https:\/\/[a-zA-Z0-9_-]+\.onrender\.com$/.test(normalizedOrigin)) {
    return true;
  }

  return false;
};

export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ [CORS] Blocked request from origin: ${origin}`);
      callback(new Error(`CORS blocked origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Disposition'],
  optionsSuccessStatus: 204
};
