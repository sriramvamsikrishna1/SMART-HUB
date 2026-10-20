import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from server root .env if it exists, with workspace root fallback
const serverEnvPath = path.resolve(__dirname, '../../.env');
const rootEnvPath = path.resolve(__dirname, '../../../.env');

dotenv.config({ path: serverEnvPath });
dotenv.config({ path: rootEnvPath });

export interface JwtConfig {
  accessSecret: string;
  refreshSecret: string;
  accessExpiresIn: string;
  refreshExpiresIn: string;
}

export interface CookieConfig {
  sameSite: 'strict' | 'lax' | 'none';
  secure: boolean;
  domain?: string;
  path: string;
  maxAgeMs: number;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  isProduction: boolean;
  corsOrigin: string | string[];
  trustProxy: boolean | number | string;
  cookie: CookieConfig;
  jwt: JwtConfig;
}

const rawPort = process.env.PORT;
const parsedPort = rawPort ? parseInt(rawPort, 10) : 5000;
const port = !isNaN(parsedPort) && parsedPort > 0 ? parsedPort : 5000;

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const rawCorsOrigin = process.env.CORS_ORIGIN;
const corsOrigin: string | string[] = rawCorsOrigin
  ? rawCorsOrigin.split(',').map((s) => s.trim())
  : ['http://localhost:5173', 'http://localhost:5174'];

function parseTrustProxy(value: string | undefined): boolean | number | string {
  if (!value || value.trim() === '' || value.trim().toLowerCase() === 'false') {
    return false;
  }
  const trimmed = value.trim();
  if (trimmed.toLowerCase() === 'true') {
    return true;
  }
  const num = parseInt(trimmed, 10);
  if (!isNaN(num) && num.toString() === trimmed && num >= 0) {
    return num;
  }
  return trimmed;
}

function parseCookieSameSite(value: string | undefined, isProd: boolean): 'strict' | 'lax' | 'none' {
  if (!value || value.trim() === '') {
    return isProd ? 'lax' : 'lax';
  }
  const lower = value.trim().toLowerCase();
  if (lower === 'strict' || lower === 'lax' || lower === 'none') {
    return lower;
  }
  console.warn(`[CONFIG WARNING] Unknown COOKIE_SAME_SITE value "${value}". Defaulting to "lax".`);
  return 'lax';
}

const trustProxy = parseTrustProxy(process.env.TRUST_PROXY);

const cookieSameSite = parseCookieSameSite(process.env.COOKIE_SAME_SITE, isProduction);
const cookieDomain = process.env.COOKIE_DOMAIN && process.env.COOKIE_DOMAIN.trim().length > 0
  ? process.env.COOKIE_DOMAIN.trim()
  : undefined;
// Browsers require secure=true whenever sameSite='none'
const cookieSecure = isProduction || cookieSameSite === 'none';

const cookie: CookieConfig = {
  sameSite: cookieSameSite,
  secure: cookieSecure,
  domain: cookieDomain,
  path: '/api/v1/auth',
  maxAgeMs: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
};

function validateSecret(secretName: string, value: string | undefined): string {
  if (!value || value.trim().length === 0) {
    throw new Error(
      `[FATAL CONFIG ERROR] ${secretName} is missing. Please define a secure secret in server/.env before starting the server.`
    );
  }

  const trimmed = value.trim();
  if (trimmed.includes('replace-with') || trimmed.length < 32) {
    throw new Error(
      `[FATAL CONFIG ERROR] ${secretName} is insecure or using a placeholder value. A minimum of 32 characters (256-bit entropy) is required.`
    );
  }

  return trimmed;
}

function validateDatabaseUrl(value: string | undefined): string {
  if (!value || value.trim().length === 0) {
    throw new Error(
      '[FATAL CONFIG ERROR] DATABASE_URL is missing. Please define your PostgreSQL connection string in server/.env before starting the server.'
    );
  }

  const trimmed = value.trim();
  if (trimmed.includes('username:password') || trimmed.includes('<USERNAME>') || trimmed.includes('<PASSWORD>')) {
    throw new Error(
      '[FATAL CONFIG ERROR] DATABASE_URL contains placeholder values. Please configure server/.env with your valid PostgreSQL connection string.'
    );
  }

  return trimmed;
}

const accessSecret = validateSecret('JWT_ACCESS_SECRET', process.env.JWT_ACCESS_SECRET);
const refreshSecret = validateSecret('JWT_REFRESH_SECRET', process.env.JWT_REFRESH_SECRET);
validateDatabaseUrl(process.env.DATABASE_URL);

if (accessSecret === refreshSecret) {
  throw new Error(
    '[FATAL CONFIG ERROR] JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be distinct, separate secrets.'
  );
}

const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export const config: AppConfig = {
  port,
  nodeEnv,
  isProduction,
  corsOrigin,
  trustProxy,
  cookie,
  jwt: {
    accessSecret,
    refreshSecret,
    accessExpiresIn,
    refreshExpiresIn
  }
};
