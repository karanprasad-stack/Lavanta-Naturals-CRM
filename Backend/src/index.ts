import http from 'http';
import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { connectDatabase, closeDatabase } from './config/db.js';
import './models/index.js';
import { requestLogger } from './middleware/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRouter from './routes/index.js';
import { initSocketServer } from './socket/index.js';

const app = express();
const httpServer = http.createServer(app);

// Initialize real-time Socket.IO communication
initSocketServer(httpServer);

// Middleware setup
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
app.use(cors({
  origin: [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(requestLogger);

// API routes
app.use('/api', apiRouter);

// Central error handler
app.use(errorHandler);

// Start server and connect DB
const startServer = async () => {
  await connectDatabase();

  httpServer.listen(config.port, () => {
    console.log(`🌿 [Server] Lavanta Naturals API & Socket.IO running on port ${config.port} (${config.nodeEnv})`);
  });

  // Graceful shutdown signals
  const shutdown = async () => {
    console.log('\n🌿 [Server] Gracefully shutting down...');
    httpServer.close(async () => {
      await closeDatabase();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

startServer();

export default app;
