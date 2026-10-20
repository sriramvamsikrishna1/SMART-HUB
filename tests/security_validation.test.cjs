const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// Resolve bcryptjs and jsonwebtoken from server node_modules
const bcrypt = require(path.resolve(__dirname, '../server/node_modules/bcryptjs'));
const jwt = require(path.resolve(__dirname, '../server/node_modules/jsonwebtoken'));

const TEST_ACCESS_SECRET = 'test-secure-access-secret-minimum-32-chars-long!';
const TEST_REFRESH_SECRET = 'test-secure-refresh-secret-minimum-32-chars-diff!';

describe('Input Validation & Sanitization', () => {
  function validateLoginInput(body) {
    if (!body || typeof body !== 'object') {
      return { isValid: false, error: 'Request body must be a JSON object.' };
    }
    const { identifier, password, role } = body;
    if (typeof identifier !== 'string' || identifier.trim().length === 0) {
      return { isValid: false, error: 'Identifier (roll number, username, or email) is required.' };
    }
    const trimmedIdentifier = identifier.trim();
    if (trimmedIdentifier.length > 100) {
      return { isValid: false, error: 'Identifier cannot exceed 100 characters.' };
    }
    if (typeof password !== 'string' || password.length === 0) {
      return { isValid: false, error: 'Password is required.' };
    }
    if (password.length > 128) {
      return { isValid: false, error: 'Password cannot exceed 128 characters.' };
    }
    let validatedRole;
    if (role !== undefined && role !== null) {
      if (typeof role !== 'string' || !['STUDENT', 'FACULTY', 'ADMIN'].includes(role)) {
        return { isValid: false, error: 'Invalid role specified. Permitted roles: STUDENT, FACULTY, ADMIN.' };
      }
      validatedRole = role;
    }
    return {
      isValid: true,
      data: { identifier: trimmedIdentifier, password, role: validatedRole }
    };
  }

  test('validates valid student login request with identifier and password', () => {
    const result = validateLoginInput({
      identifier: '21CS001',
      password: 'SecurePassword123!',
      role: 'STUDENT'
    });
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.data.identifier, '21CS001');
    assert.strictEqual(result.data.role, 'STUDENT');
  });

  test('trims leading/trailing whitespace from identifier', () => {
    const result = validateLoginInput({
      identifier: '  user@institution.edu  ',
      password: 'password123'
    });
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.data.identifier, 'user@institution.edu');
  });

  test('rejects empty or whitespace-only identifier', () => {
    const result = validateLoginInput({ identifier: '   ', password: 'password123' });
    assert.strictEqual(result.isValid, false);
    assert.match(result.error, /Identifier .* is required/);
  });

  test('rejects missing password', () => {
    const result = validateLoginInput({ identifier: 'admin@institution.edu' });
    assert.strictEqual(result.isValid, false);
    assert.match(result.error, /Password is required/);
  });

  test('rejects identifier exceeding 100 characters', () => {
    const result = validateLoginInput({ identifier: 'a'.repeat(101), password: 'password123' });
    assert.strictEqual(result.isValid, false);
    assert.match(result.error, /cannot exceed 100 characters/);
  });

  test('rejects invalid role string', () => {
    const result = validateLoginInput({
      identifier: 'user1',
      password: 'password123',
      role: 'SUPERUSER'
    });
    assert.strictEqual(result.isValid, false);
    assert.match(result.error, /Invalid role specified/);
  });
});

describe('Password Hashing Security (bcryptjs)', () => {
  test('hashes password using 12 salt rounds and verifies correctly', async () => {
    const rawPassword = 'StudentStrongPassword2026!';
    const saltRounds = 12;
    const hash = await bcrypt.hash(rawPassword, saltRounds);

    // Verify bcrypt hash format: $2a$12$ or $2b$12$ indicates 12 salt rounds
    assert.match(hash, /^\$2[ab]\$12\$/);

    // Verify correct password matches
    const isMatch = await bcrypt.compare(rawPassword, hash);
    assert.strictEqual(isMatch, true);

    // Verify incorrect password fails
    const isBadMatch = await bcrypt.compare('WrongPassword!', hash);
    assert.strictEqual(isBadMatch, false);
  });
});

describe('JWT Signature, Expiration, and Token Type Discrimination', () => {
  function signAccessToken(user, secret = TEST_ACCESS_SECRET, expiresIn = '15m') {
    return jwt.sign(
      { sub: user.id, role: user.role, email: user.email, tokenType: 'ACCESS' },
      secret,
      { expiresIn, algorithm: 'HS256' }
    );
  }

  function signRefreshToken(user, secret = TEST_REFRESH_SECRET, expiresIn = '7d') {
    return jwt.sign(
      { sub: user.id, tokenType: 'REFRESH' },
      secret,
      { expiresIn, algorithm: 'HS256', jwtid: 'test-jti-12345' }
    );
  }

  function verifyAccessToken(token, secret = TEST_ACCESS_SECRET) {
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
    if (!decoded || decoded.tokenType !== 'ACCESS') {
      throw new Error('Invalid token type: expected an access token');
    }
    return decoded;
  }

  function verifyRefreshToken(token, secret = TEST_REFRESH_SECRET) {
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
    if (!decoded || decoded.tokenType !== 'REFRESH') {
      throw new Error('Invalid token type: expected a refresh token');
    }
    return decoded;
  }

  test('successfully signs and verifies a valid access token', () => {
    const user = { id: 'user-uuid-1', role: 'STUDENT', email: 'student@institution.edu' };
    const token = signAccessToken(user);
    const decoded = verifyAccessToken(token);

    assert.strictEqual(decoded.sub, user.id);
    assert.strictEqual(decoded.role, user.role);
    assert.strictEqual(decoded.email, user.email);
    assert.strictEqual(decoded.tokenType, 'ACCESS');
  });

  test('successfully signs and verifies a valid refresh token', () => {
    const user = { id: 'user-uuid-2' };
    const token = signRefreshToken(user);
    const decoded = verifyRefreshToken(token);

    assert.strictEqual(decoded.sub, user.id);
    assert.strictEqual(decoded.tokenType, 'REFRESH');
  });

  test('rejects token signed with wrong secret (access token verified with refresh secret)', () => {
    const user = { id: 'user-uuid-1', role: 'ADMIN', email: 'admin@institution.edu' };
    const accessToken = signAccessToken(user, TEST_ACCESS_SECRET);

    assert.throws(
      () => verifyAccessToken(accessToken, TEST_REFRESH_SECRET),
      /invalid signature/
    );
  });

  test('rejects refresh token when presented as an access token (type discrimination)', () => {
    const user = { id: 'user-uuid-1' };
    // Sign with access secret but tokenType REFRESH
    const rogueToken = jwt.sign(
      { sub: user.id, tokenType: 'REFRESH' },
      TEST_ACCESS_SECRET,
      { expiresIn: '15m', algorithm: 'HS256' }
    );

    assert.throws(
      () => verifyAccessToken(rogueToken, TEST_ACCESS_SECRET),
      /Invalid token type: expected an access token/
    );
  });

  test('rejects expired token', () => {
    const user = { id: 'user-uuid-1', role: 'STUDENT', email: 'expired@institution.edu' };
    // Token that expired 5 seconds ago
    const expiredToken = signAccessToken(user, TEST_ACCESS_SECRET, '-5s');

    assert.throws(
      () => verifyAccessToken(expiredToken),
      /jwt expired/
    );
  });
});
