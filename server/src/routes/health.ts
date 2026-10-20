import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma';

export const healthRouter = Router();

healthRouter.get('/health', async (_req: Request, res: Response) => {
  let dbStatus = 'healthy';
  let isHealthy = true;

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'unreachable';
    isHealthy = false;
  }

  const statusCode = isHealthy ? 200 : 503;
  res.status(statusCode).json({
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'smart-cse-hub-api',
    version: '1.0.0',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

