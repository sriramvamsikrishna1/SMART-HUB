import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request, Response } from 'express';
import { config } from '../config';

/**
 * Strict rate limiter for authentication endpoints (e.g. login attempts).
 * Limits requests to 5 per 15 minutes per IP to prevent brute-force attacks.
 * Uses safe IP normalization via ipKeyGenerator without trusting forwarded headers blindly.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  standardHeaders: true, // Return standard RateLimit headers
  legacyHeaders: false, // Disable X-RateLimit headers
  skipSuccessfulRequests: true, // Only failed authentication attempts count against the limit
  validate: {
    trustProxy: config.trustProxy !== false
  },
  keyGenerator: (req: Request): string => {
    return ipKeyGenerator(req.ip || req.socket?.remoteAddress || '127.0.0.1');
  },
  handler: (_req: Request, res: Response, _next, options) => {
    res.status(options.statusCode).json({
      status: 'fail',
      message:
        typeof options.message === 'string'
          ? options.message
          : (options.message as any)?.message ||
            'Too many authentication attempts. Please try again after 15 minutes.',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * General API rate limiter for standard endpoints.
 * Allows 100 requests per 15 minutes per IP.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: config.trustProxy !== false
  },
  keyGenerator: (req: Request): string => {
    return ipKeyGenerator(req.ip || req.socket?.remoteAddress || '127.0.0.1');
  },
  handler: (_req: Request, res: Response, _next, options) => {
    res.status(options.statusCode).json({
      status: 'fail',
      message: 'Too many API requests from this client. Please slow down.',
      timestamp: new Date().toISOString()
    });
  }
});
