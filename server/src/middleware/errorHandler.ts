import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export interface AppError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
}

export function notFoundHandler(req: Request, res: Response, _next: NextFunction): void {
  res.status(404).json({
    status: 'fail',
    message: `Cannot ${req.method} ${req.originalUrl} - Route not found`,
    timestamp: new Date().toISOString()
  });
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const status = err.status || (statusCode >= 400 && statusCode < 500 ? 'fail' : 'error');

  // Detailed server-side diagnostics for unexpected server errors (500+)
  if (statusCode >= 500) {
    const safeMsg = (err.message || 'Unknown internal error').replace(
      /:\/\/[^:]+:[^@]+@/,
      '://<credentials-hidden>@'
    );
    console.error(`[SERVER ERROR] ${err.name || 'Error'} (${statusCode}): ${safeMsg}`);
    if (err.stack) {
      console.error(err.stack);
    }
  }

  // In production, mask raw internal 500 error messages unless explicitly marked as operational
  let clientMessage = err.message || 'Internal server error';
  if (config.isProduction && statusCode >= 500 && !err.isOperational) {
    clientMessage = 'An internal server error occurred. Please try again later.';
  }

  const responseBody: Record<string, unknown> = {
    status,
    message: clientMessage,
    timestamp: new Date().toISOString()
  };

  if (!config.isProduction && err.stack) {
    responseBody.stack = err.stack;
  }

  res.status(statusCode).json(responseBody);
}
