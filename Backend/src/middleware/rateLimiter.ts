import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

interface ClientRecord {
  count: number;
  resetTime: number;
}

export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, maxRequests, message = 'Too many requests, please try again later.' } = options;
  const clients = new Map<string, ClientRecord>();

  // Periodically clean expired records to prevent memory growth
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of clients.entries()) {
      if (now > record.resetTime) {
        clients.delete(key);
      }
    }
  }, Math.max(30000, windowMs));

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIp =
      (req.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket?.remoteAddress ||
      'unknown';

    const now = Date.now();
    let record = clients.get(clientIp);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      clients.set(clientIp, record);
      next();
      return;
    }

    record.count++;

    if (record.count > maxRequests) {
      if (typeof res.setHeader === 'function') {
        res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));
      }
      res.status(429).json({
        success: false,
        message,
        code: 'RATE_LIMIT_EXCEEDED'
      });
      return;
    }

    next();
  };
}

// Pre-configured rate limiters for sensitive routes
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 30, // 30 attempts per 15 min
  message: 'Too many login attempts from this IP. Please wait 15 minutes before trying again.'
});

export const exportRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 exports per minute
  message: 'Export limit reached. Please wait a moment before downloading another export.'
});
