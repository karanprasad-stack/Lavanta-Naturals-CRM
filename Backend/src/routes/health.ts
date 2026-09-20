import { Router, Request, Response } from 'express';
import { isDbConnected } from '../config/db.js';
import { config } from '../config/env.js';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  const dbStatus = isDbConnected() ? 'connected' : 'disconnected';

  res.status(200).json({
    status: 'ok',
    service: 'Lavanta Naturals API',
    database: dbStatus,
    storage: 'connected',
    realtime: 'connected',
    environment: config.nodeEnv,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

export default router;
