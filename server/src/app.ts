import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { adminRouter } from './routes/admin';
import { facultyRouter } from './routes/faculty';
import { apiRateLimiter } from './middleware/rateLimiter';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';

export function createApp(): Express {
  const app = express();

  // Reverse-proxy trust configuration
  // Configured via TRUST_PROXY env variable (e.g. 1 for single reverse-proxy, loopback, or false)
  if (config.trustProxy !== false) {
    app.set('trust proxy', config.trustProxy);
  }

  // Secure HTTP headers
  app.use(helmet());

  // Cross-Origin Resource Sharing
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true
    })
  );

  // Cookie parsing for HttpOnly refresh tokens
  app.use(cookieParser());

  // Request body parsing - limited to 1MB to prevent memory exhaustion / DoS
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // API v1 Public Health Check (Exempt from general rate limiting for monitoring uptime)
  app.use('/api/v1', healthRouter);

  // General API Rate Limiter (Applied across all operational /api/v1 endpoints)
  app.use('/api/v1', apiRateLimiter);

  // API v1 Authentication Routes
  app.use('/api/v1/auth', authRouter);

  // API v1 Faculty Operations (Protected by authenticate & requireRole(FACULTY, ADMIN))
  app.use('/api/v1/faculty', facultyRouter);

  // API v1 Administrative Management Routes (Protected by authenticate & requireRole(ADMIN))
  app.use('/api/v1/admin', adminRouter);

  // Fallback 404 handler for unmatched routes
  app.use(notFoundHandler);

  // Centralized error handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
