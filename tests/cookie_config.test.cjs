const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

/**
 * Cookie configuration builder matching server/src/config/index.ts and authController.ts
 */
function buildCookieOptions({ isProduction, sameSiteEnv, domainEnv }) {
  const normalizedSameSite = (() => {
    if (!sameSiteEnv || sameSiteEnv.trim() === '') return 'lax';
    const lower = sameSiteEnv.trim().toLowerCase();
    if (lower === 'strict' || lower === 'lax' || lower === 'none') return lower;
    return 'lax';
  })();

  const secure = isProduction || normalizedSameSite === 'none';
  const domain = domainEnv && domainEnv.trim().length > 0 ? domainEnv.trim() : undefined;

  const refreshOptions = {
    httpOnly: true,
    secure,
    sameSite: normalizedSameSite,
    path: '/api/v1/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
  };

  if (domain) {
    refreshOptions.domain = domain;
  }

  const { maxAge: _maxAge, ...clearOptions } = refreshOptions;

  return { refreshOptions, clearOptions };
}

describe('Refresh Cookie Policy & Clear Options Parity', () => {
  test('development default uses sameSite=lax, httpOnly=true, secure=false, path=/api/v1/auth', () => {
    const { refreshOptions, clearOptions } = buildCookieOptions({
      isProduction: false,
      sameSiteEnv: undefined,
      domainEnv: undefined
    });

    assert.strictEqual(refreshOptions.httpOnly, true);
    assert.strictEqual(refreshOptions.secure, false);
    assert.strictEqual(refreshOptions.sameSite, 'lax');
    assert.strictEqual(refreshOptions.path, '/api/v1/auth');
    assert.strictEqual(refreshOptions.maxAge, 604800000);
    assert.strictEqual(refreshOptions.domain, undefined);

    // Parity check for clearOptions
    assert.strictEqual(clearOptions.httpOnly, true);
    assert.strictEqual(clearOptions.secure, false);
    assert.strictEqual(clearOptions.sameSite, 'lax');
    assert.strictEqual(clearOptions.path, '/api/v1/auth');
    assert.strictEqual(clearOptions.maxAge, undefined);
  });

  test('production environment strictly enforces secure=true', () => {
    const { refreshOptions, clearOptions } = buildCookieOptions({
      isProduction: true,
      sameSiteEnv: 'strict',
      domainEnv: undefined
    });

    assert.strictEqual(refreshOptions.secure, true);
    assert.strictEqual(refreshOptions.sameSite, 'strict');
    assert.strictEqual(clearOptions.secure, true);
    assert.strictEqual(clearOptions.sameSite, 'strict');
  });

  test('cross-site sameSite=none strictly enforces secure=true even if not production', () => {
    const { refreshOptions, clearOptions } = buildCookieOptions({
      isProduction: false,
      sameSiteEnv: 'none',
      domainEnv: undefined
    });

    assert.strictEqual(refreshOptions.sameSite, 'none');
    assert.strictEqual(refreshOptions.secure, true, 'SameSite=None must mandate Secure=true');
    assert.strictEqual(clearOptions.sameSite, 'none');
    assert.strictEqual(clearOptions.secure, true);
  });

  test('supports optional COOKIE_DOMAIN for cross-subdomain authentication', () => {
    const { refreshOptions, clearOptions } = buildCookieOptions({
      isProduction: true,
      sameSiteEnv: 'lax',
      domainEnv: '.institution.edu'
    });

    assert.strictEqual(refreshOptions.domain, '.institution.edu');
    assert.strictEqual(clearOptions.domain, '.institution.edu');
  });

  test('falls back safely to lax if invalid sameSite string is provided', () => {
    const { refreshOptions } = buildCookieOptions({
      isProduction: true,
      sameSiteEnv: 'invalid_policy',
      domainEnv: undefined
    });

    assert.strictEqual(refreshOptions.sameSite, 'lax');
  });

  test('cookie clear options exactly match cookie set options attributes', () => {
    const { refreshOptions, clearOptions } = buildCookieOptions({
      isProduction: true,
      sameSiteEnv: 'none',
      domainEnv: 'app.example.com'
    });

    assert.strictEqual(clearOptions.httpOnly, refreshOptions.httpOnly);
    assert.strictEqual(clearOptions.secure, refreshOptions.secure);
    assert.strictEqual(clearOptions.sameSite, refreshOptions.sameSite);
    assert.strictEqual(clearOptions.path, refreshOptions.path);
    assert.strictEqual(clearOptions.domain, refreshOptions.domain);
    assert.strictEqual('maxAge' in clearOptions, false);
  });
});
