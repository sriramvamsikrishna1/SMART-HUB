const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

describe('Vercel Deployment Configuration (vercel.json)', () => {
  const vercelConfigPath = path.resolve(__dirname, '../vercel.json');

  test('vercel.json exists and is valid JSON', () => {
    assert.strictEqual(fs.existsSync(vercelConfigPath), true);
    const content = fs.readFileSync(vercelConfigPath, 'utf8');
    const parsed = JSON.parse(content);
    assert.strictEqual(typeof parsed, 'object');
  });

  test('vercel.json specifies correct build and install commands', () => {
    const config = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
    assert.strictEqual(config.version, 2);
    assert.strictEqual(config.framework, 'vite');
    assert.strictEqual(config.outputDirectory, 'dist');
    assert.strictEqual(config.buildCommand, 'npm run build:vercel');
    assert.strictEqual(config.installCommand, 'npm install && npm --prefix server install');
  });

  test('vercel.json rewrites correctly map /api routes to the serverless function', () => {
    const config = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
    assert.ok(Array.isArray(config.rewrites));

    const apiRewrite = config.rewrites.find(r => r.source === '/api/(.*)');
    assert.ok(apiRewrite, 'Must have a rewrite rule for /api/(.*)');
    assert.strictEqual(apiRewrite.destination, '/api');

    const spaRewrite = config.rewrites.find(r => r.source === '/((?!api/).*)');
    assert.ok(spaRewrite, 'Must have an SPA fallback rewrite for non-api routes');
    assert.strictEqual(spaRewrite.destination, '/index.html');
  });
});

describe('Vercel Serverless Function Handler (api/index.ts)', () => {
  const apiEntryPath = path.resolve(__dirname, '../api/index.ts');

  test('api/index.ts exists in root directory', () => {
    assert.strictEqual(fs.existsSync(apiEntryPath), true);
  });

  test('api/index.ts imports existing Express app and exports default without starting a listener', () => {
    const content = fs.readFileSync(apiEntryPath, 'utf8');
    assert.match(content, /import\s*\{\s*app\s*\}\s*from\s*['"]\.\.\/server\/src\/app['"]/);
    assert.match(content, /export\s+default\s+app/);
    assert.doesNotMatch(content, /\.listen\(/, 'Serverless function must NOT call app.listen()');
  });
});

describe('Prisma Serverless Singleton Strategy', () => {
  const prismaFilePath = path.resolve(__dirname, '../server/src/db/prisma.ts');

  test('server/src/db/prisma.ts implements globalThis caching', () => {
    const content = fs.readFileSync(prismaFilePath, 'utf8');
    assert.match(content, /globalThis\s+as\s+unknown\s+as/);
    assert.match(content, /globalForPrisma\.prisma/);
    assert.match(content, /export\s+const\s+prisma\s*=/);
  });
});

describe('Vercel Routing Simulation', () => {
  // Regex simulation of vercel.json rewrite rules
  const apiRegex = /^\/api\/(.*)$/;
  const spaRegex = /^(?!\/api\/)(.*)$/;

  test('correctly classifies API endpoints vs SPA client routes', () => {
    const apiRoutes = [
      '/api/v1/health',
      '/api/v1/auth/login',
      '/api/v1/auth/refresh',
      '/api/v1/faculty/courses',
      '/api/v1/admin/users'
    ];

    const spaRoutes = [
      '/',
      '/student',
      '/student/dashboard',
      '/faculty',
      '/faculty/grades',
      '/admin',
      '/admin/settings'
    ];

    for (const route of apiRoutes) {
      assert.strictEqual(apiRegex.test(route), true, `Route ${route} should match API rewrite`);
      assert.strictEqual(spaRegex.test(route), false, `Route ${route} should NOT match SPA fallback`);
    }

    for (const route of spaRoutes) {
      assert.strictEqual(apiRegex.test(route), false, `Route ${route} should NOT match API rewrite`);
      assert.strictEqual(spaRegex.test(route), true, `Route ${route} should match SPA fallback`);
    }
  });
});
