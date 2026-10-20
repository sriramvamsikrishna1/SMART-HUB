import { app } from './app';
import { config } from './config';
import { prisma } from './db/prisma';

// Helper to sanitize any error message and remove connection strings or passwords
function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message.replace(/:\/\/[^:]+:[^@]+@/, '://<credentials-hidden>@');
  }
  return String(error);
}

async function verifyDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('[DATABASE] PostgreSQL connection verified successfully.');
  } catch (err) {
    console.error('[DATABASE WARNING] Database connection check failed.');
    console.error(`[DATABASE WARNING] Diagnostic: ${sanitizeError(err)}`);
    console.error('[DATABASE WARNING] If using Neon Serverless, the compute instance may be starting up, or check server/.env settings.');
  }
}

const server = app.listen(config.port, async () => {
  console.log(`[SERVER] SMART CSE HUB backend running in ${config.nodeEnv} mode on port ${config.port}`);
  console.log(`[SERVER] Health endpoint available at: http://localhost:${config.port}/api/v1/health`);
  await verifyDatabaseConnection();
});

// Explicit server error handling (e.g. port already occupied)
server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[SERVER FATAL] Port ${config.port} is already in use by another process.`);
    console.error(`[SERVER FATAL] Please stop any existing server running on port ${config.port} or update PORT in server/.env.`);
  } else {
    console.error('[SERVER FATAL] Server failed to start:', err.message);
  }
  process.exit(1);
});

// Graceful shutdown handling
function handleShutdown(signal: string) {
  console.log(`[SERVER] Received ${signal}. Gracefully shutting down...`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log('[DATABASE] Prisma client disconnected cleanly.');
    } catch {
      // Ignore disconnect errors during process exit
    }
    console.log('[SERVER] HTTP server closed cleanly.');
    process.exit(0);
  });

  // Force exit after 5 seconds if connections refuse to close
  setTimeout(() => {
    console.error('[SERVER] Forcefully terminating server process after timeout.');
    process.exit(1);
  }, 5000).unref();
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export { server };

