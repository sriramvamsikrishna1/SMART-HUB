import { app } from '../server/src/app';

/**
 * Vercel Serverless Function entry point.
 * Exports the Express application directly for the @vercel/node runtime.
 * Mounts existing API routes without launching a persistent server listener.
 */
export default app;
