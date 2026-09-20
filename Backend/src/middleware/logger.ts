import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusColor = status >= 500 ? '❌' : status >= 400 ? '⚠️' : '🌿';
    console.log(`${statusColor} [${method}] ${originalUrl} -> ${status} (${duration}ms)`);
  });

  next();
};
