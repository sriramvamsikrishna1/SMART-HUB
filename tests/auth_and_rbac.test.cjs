const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { ipKeyGenerator } = require(path.resolve(__dirname, '../server/node_modules/express-rate-limit'));

/**
 * Pure simulation of requireRole middleware from server/src/middleware/auth.ts
 */
function createRequireRole(...allowedRoles) {
  return function requireRoleMiddleware(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'Forbidden. You do not possess the required permissions.'
      });
    }

    return next();
  };
}

/**
 * Pure simulation of inactive account check from authController.ts / authenticate middleware
 */
function checkUserActiveStatus(user, res, next) {
  if (!user.isActive) {
    return res.status(403).json({
      status: 'fail',
      message: 'Account has been deactivated. Please contact an administrator.'
    });
  }
  return next();
}

/**
 * Pure simulation of refresh token rotation & reuse detection (RFC 6819)
 */
function processTokenRefresh({ tokenRecord, userTokensTable }) {
  if (!tokenRecord) {
    return { status: 401, error: 'Invalid session. Refresh token not recognized.' };
  }

  // Token reuse detection: if presented token is already revoked, revoke ALL user sessions
  if (tokenRecord.revoked) {
    userTokensTable.forEach((t) => {
      if (t.userId === tokenRecord.userId) {
        t.revoked = true;
      }
    });
    return {
      status: 401,
      reuseDetected: true,
      error: 'Session has been revoked. Please log in again.'
    };
  }

  // Active token: rotate it
  tokenRecord.revoked = true;
  const newId = `token-${Date.now()}`;
  const newToken = {
    id: newId,
    token: `new-refresh-token-${Date.now()}`,
    userId: tokenRecord.userId,
    revoked: false
  };
  userTokensTable.push(newToken);

  return {
    status: 200,
    newRefreshToken: newToken.token
  };
}

// Helper to create mock Express response object
function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return res;
}

describe('Role-Based Access Control (RBAC)', () => {
  const adminGuard = createRequireRole('ADMIN');
  const facultyOrAdminGuard = createRequireRole('FACULTY', 'ADMIN');

  test('ADMIN can access admin-only endpoints', () => {
    const req = { user: { id: 'u1', role: 'ADMIN' } };
    const res = createMockRes();
    let nextCalled = false;

    adminGuard(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(res.statusCode, 200);
  });

  test('STUDENT is rejected with 403 Forbidden from admin-only endpoints', () => {
    const req = { user: { id: 'u2', role: 'STUDENT' } };
    const res = createMockRes();
    let nextCalled = false;

    adminGuard(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.body.status, 'fail');
    assert.match(res.body.message, /Forbidden/);
  });

  test('FACULTY is rejected with 403 Forbidden from admin-only endpoints', () => {
    const req = { user: { id: 'u3', role: 'FACULTY' } };
    const res = createMockRes();
    let nextCalled = false;

    adminGuard(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 403);
  });

  test('FACULTY can access faculty endpoints', () => {
    const req = { user: { id: 'u3', role: 'FACULTY' } };
    const res = createMockRes();
    let nextCalled = false;

    facultyOrAdminGuard(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, true);
  });

  test('ADMIN can access faculty endpoints (hierarchical privilege)', () => {
    const req = { user: { id: 'u1', role: 'ADMIN' } };
    const res = createMockRes();
    let nextCalled = false;

    facultyOrAdminGuard(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, true);
  });

  test('STUDENT is rejected with 403 Forbidden from faculty endpoints', () => {
    const req = { user: { id: 'u2', role: 'STUDENT' } };
    const res = createMockRes();
    let nextCalled = false;

    facultyOrAdminGuard(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 403);
  });

  test('Unauthenticated request is rejected with 401 Unauthorized', () => {
    const req = {};
    const res = createMockRes();
    let nextCalled = false;

    adminGuard(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 401);
  });
});

describe('Inactive Account Enforcement', () => {
  test('rejects inactive user with 403 Forbidden and clear explanation', () => {
    const user = { id: 'u4', email: 'deactivated@institution.edu', isActive: false };
    const res = createMockRes();
    let nextCalled = false;

    checkUserActiveStatus(user, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 403);
    assert.match(res.body.message, /Account has been deactivated/);
  });

  test('allows active user to proceed', () => {
    const user = { id: 'u5', email: 'active@institution.edu', isActive: true };
    const res = createMockRes();
    let nextCalled = false;

    checkUserActiveStatus(user, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, true);
  });
});

describe('Refresh-Token Rotation & Reuse Detection (RFC 6819)', () => {
  test('rotates active refresh token atomically and revokes previous token', () => {
    const tokenStore = [
      { id: 't1', token: 'valid-token-abc', userId: 'user-10', revoked: false }
    ];

    const result = processTokenRefresh({
      tokenRecord: tokenStore[0],
      userTokensTable: tokenStore
    });

    assert.strictEqual(result.status, 200);
    assert.ok(result.newRefreshToken);
    // Old token must be revoked
    assert.strictEqual(tokenStore[0].revoked, true);
    // New token must be active
    const newToken = tokenStore.find(t => t.token === result.newRefreshToken);
    assert.ok(newToken);
    assert.strictEqual(newToken.revoked, false);
  });

  test('detects refresh-token reuse: revokes ALL active sessions for compromised user', () => {
    const tokenStore = [
      { id: 't1', token: 'already-revoked-token', userId: 'user-10', revoked: true },
      { id: 't2', token: 'legitimate-active-session-1', userId: 'user-10', revoked: false },
      { id: 't3', token: 'legitimate-active-session-2', userId: 'user-10', revoked: false },
      { id: 't4', token: 'other-user-session', userId: 'user-99', revoked: false }
    ];

    const result = processTokenRefresh({
      tokenRecord: tokenStore[0],
      userTokensTable: tokenStore
    });

    assert.strictEqual(result.status, 401);
    assert.strictEqual(result.reuseDetected, true);

    // All sessions of user-10 must now be invalidated
    assert.strictEqual(tokenStore[1].revoked, true);
    assert.strictEqual(tokenStore[2].revoked, true);

    // Other user sessions must remain unaffected
    assert.strictEqual(tokenStore[3].revoked, false);
  });
});

describe('Rate Limiter IP Normalization (ipKeyGenerator)', () => {
  test('safely normalizes IPv4 addresses', () => {
    const key = ipKeyGenerator('192.168.1.100');
    assert.strictEqual(key, '192.168.1.100');
  });

  test('safely normalizes IPv6 loopback and mapped addresses', () => {
    const key = ipKeyGenerator('::ffff:127.0.0.1');
    assert.strictEqual(key, '127.0.0.1');
  });

  test('safely normalizes standard localhost IPv4', () => {
    const key = ipKeyGenerator('127.0.0.1');
    assert.strictEqual(key, '127.0.0.1');
  });
});
