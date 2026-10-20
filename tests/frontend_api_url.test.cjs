const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

/**
 * Mirror of resolveApiUrl function from src/services/api.ts for isolated automated testing.
 */
function resolveApiUrlWithEnv(endpoint, envBase) {
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }

  const rawBase = envBase;
  if (!rawBase || typeof rawBase !== 'string' || rawBase.trim() === '') {
    return endpoint;
  }

  const cleanBase = rawBase.trim().replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (cleanBase.endsWith('/api/v1') && cleanEndpoint.startsWith('/api/v1')) {
    return `${cleanBase}${cleanEndpoint.slice(7)}`;
  }

  return `${cleanBase}${cleanEndpoint}`;
}

describe('Frontend API URL Construction (resolveApiUrl)', () => {
  test('returns relative endpoint when VITE_API_URL is undefined (development mode)', () => {
    const result = resolveApiUrlWithEnv('/api/v1/auth/login', undefined);
    assert.strictEqual(result, '/api/v1/auth/login');
  });

  test('returns relative endpoint when VITE_API_URL is empty string', () => {
    const result = resolveApiUrlWithEnv('/api/v1/auth/login', '   ');
    assert.strictEqual(result, '/api/v1/auth/login');
  });

  test('prepends absolute origin when VITE_API_URL is configured without trailing slash', () => {
    const result = resolveApiUrlWithEnv('/api/v1/auth/login', 'https://api.institution.edu');
    assert.strictEqual(result, 'https://api.institution.edu/api/v1/auth/login');
  });

  test('normalizes trailing slash in VITE_API_URL to prevent double slashes', () => {
    const result = resolveApiUrlWithEnv('/api/v1/auth/login', 'https://api.institution.edu/');
    assert.strictEqual(result, 'https://api.institution.edu/api/v1/auth/login');
  });

  test('prevents duplication if VITE_API_URL already contains /api/v1', () => {
    const result = resolveApiUrlWithEnv('/api/v1/auth/login', 'https://api.institution.edu/api/v1');
    assert.strictEqual(result, 'https://api.institution.edu/api/v1/auth/login');
  });

  test('prevents duplication if VITE_API_URL has trailing slash and /api/v1', () => {
    const result = resolveApiUrlWithEnv('/api/v1/auth/refresh', 'https://api.institution.edu/api/v1/');
    assert.strictEqual(result, 'https://api.institution.edu/api/v1/auth/refresh');
  });

  test('handles endpoints missing leading slash gracefully', () => {
    const result = resolveApiUrlWithEnv('api/v1/auth/logout', 'https://api.institution.edu');
    assert.strictEqual(result, 'https://api.institution.edu/api/v1/auth/logout');
  });

  test('preserves absolute URLs passed directly as endpoint', () => {
    const result = resolveApiUrlWithEnv('https://cdn.institution.edu/document.pdf', 'https://api.institution.edu');
    assert.strictEqual(result, 'https://cdn.institution.edu/document.pdf');
  });
});
