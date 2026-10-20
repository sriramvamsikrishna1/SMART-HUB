import { Request, Response, NextFunction, CookieOptions } from 'express';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { prisma } from '../db/prisma';
import { config } from '../config';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { validateLoginInput } from '../utils/validation';

export const REFRESH_COOKIE_NAME = 'refreshToken';

export function getRefreshCookieOptions(): CookieOptions {
  const options: CookieOptions = {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    path: config.cookie.path,
    maxAge: config.cookie.maxAgeMs
  };

  if (config.cookie.domain) {
    options.domain = config.cookie.domain;
  }

  return options;
}

export function getClearCookieOptions(): CookieOptions {
  const { maxAge: _maxAge, ...clearOptions } = getRefreshCookieOptions();
  return clearOptions;
}

/**
 * Resolves a User record by role-specific identifier or email with case-insensitivity and username support
 */
async function findUserByIdentifier(identifier: string, role?: Role) {
  const trimmed = identifier.trim();

  // Helper to resolve admin profile
  async function resolveAdmin() {
    const admin = await prisma.adminProfile.findFirst({
      where: {
        OR: [
          { adminCode: { equals: trimmed, mode: 'insensitive' } },
          { user: { email: { equals: trimmed, mode: 'insensitive' } } },
          { user: { email: { startsWith: `${trimmed}@`, mode: 'insensitive' } } }
        ]
      },
      include: { user: true }
    });
    if (admin && admin.user) {
      const { user, ...profile } = admin;
      return { user, profile };
    }
    return null;
  }

  // Helper to resolve student profile
  async function resolveStudent() {
    const student = await prisma.studentProfile.findFirst({
      where: {
        OR: [
          { studentId: { equals: trimmed, mode: 'insensitive' } },
          { user: { email: { equals: trimmed, mode: 'insensitive' } } },
          { user: { email: { startsWith: `${trimmed}@`, mode: 'insensitive' } } }
        ]
      },
      include: { user: true }
    });
    if (student && student.user) {
      const { user, ...profile } = student;
      return { user, profile };
    }
    return null;
  }

  // Helper to resolve faculty profile
  async function resolveFaculty() {
    const faculty = await prisma.facultyProfile.findFirst({
      where: {
        OR: [
          { facultyId: { equals: trimmed, mode: 'insensitive' } },
          { user: { email: { equals: trimmed, mode: 'insensitive' } } },
          { user: { email: { startsWith: `${trimmed}@`, mode: 'insensitive' } } }
        ]
      },
      include: { user: true }
    });
    if (faculty && faculty.user) {
      const { user, ...profile } = faculty;
      return { user, profile };
    }
    return null;
  }

  // 1. Check primary declared role first
  if (role === Role.STUDENT) {
    const found = await resolveStudent();
    if (found) return found;
  } else if (role === Role.FACULTY) {
    const found = await resolveFaculty();
    if (found) return found;
  } else if (role === Role.ADMIN) {
    const found = await resolveAdmin();
    if (found) return found;
  }

  // 2. Resilient fallback across all roles:
  // Allows user to authenticate even if the modal role tab was mismatched
  const adminCandidate = await resolveAdmin();
  if (adminCandidate) return adminCandidate;

  const facultyCandidate = await resolveFaculty();
  if (facultyCandidate) return facultyCandidate;

  const studentCandidate = await resolveStudent();
  if (studentCandidate) return studentCandidate;

  return null;
}

/**
 * POST /api/v1/auth/login
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  const clientIp = req.ip || req.socket?.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    const validation = validateLoginInput(req.body);
    if (!validation.isValid || !validation.data) {
      res.status(400).json({
        status: 'fail',
        message: validation.error || 'Invalid request body.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { identifier, password, role } = validation.data;

    // Look up candidate user through relations
    const resolved = await findUserByIdentifier(identifier, role);

    if (!resolved || !resolved.user) {
      // Record failed audit log
      await prisma.auditLog.create({
        data: {
          action: 'AUTH_LOGIN_FAILED',
          resource: 'auth/login',
          details: JSON.stringify({ reason: 'USER_NOT_FOUND', roleAttempted: role || 'UNSPECIFIED' }),
          ipAddress: clientIp,
          userAgent
        }
      });

      res.status(401).json({
        status: 'fail',
        message: 'Invalid identifier or password',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { user, profile } = resolved;

    // Reject inactive accounts
    if (!user.isActive) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'AUTH_LOGIN_FAILED',
          resource: 'auth/login',
          details: JSON.stringify({ reason: 'ACCOUNT_DEACTIVATED' }),
          ipAddress: clientIp,
          userAgent
        }
      });

      res.status(403).json({
        status: 'fail',
        message: 'Account has been deactivated. Please contact an administrator.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Secure password verification with bcrypt
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'AUTH_LOGIN_FAILED',
          resource: 'auth/login',
          details: JSON.stringify({ reason: 'INVALID_PASSWORD' }),
          ipAddress: clientIp,
          userAgent
        }
      });

      res.status(401).json({
        status: 'fail',
        message: 'Invalid identifier or password',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Generate token pair
    const accessToken = signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      profileId: profile?.id
    });

    const refreshToken = signRefreshToken({ id: user.id });

    // Store refresh token in database (7-day validity)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt
      }
    });

    // Record success in audit logs
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'AUTH_LOGIN_SUCCESS',
        resource: 'auth/login',
        details: JSON.stringify({ role: user.role }),
        ipAddress: clientIp,
        userAgent
      }
    });

    // Set secure HttpOnly cookie for refresh token
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());

    // Resolve user identifier
    const resolvedIdentifier =
      (profile as any)?.studentId ||
      (profile as any)?.facultyId ||
      (profile as any)?.adminCode ||
      user.email;

    // Sanitize profile to ensure no user relation or passwordHash is ever leaked in API responses
    const sanitizedProfile = profile ? { ...profile } : null;
    if (sanitizedProfile) {
      delete (sanitizedProfile as any).user;
      delete (sanitizedProfile as any).passwordHash;
    }

    res.status(200).json({
      status: 'success',
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          identifier: resolvedIdentifier,
          profile: sanitizedProfile
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/refresh
 */
export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  const clientIp = req.ip || req.socket?.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;

    if (!rawToken || typeof rawToken !== 'string') {
      res.status(401).json({
        status: 'fail',
        message: 'Authentication required. No refresh token provided.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verify cryptographic signature and tokenType
    let decoded;
    try {
      decoded = verifyRefreshToken(rawToken);
    } catch (tokenErr: any) {
      res.status(401).json({
        status: 'fail',
        message: tokenErr.message || 'Invalid or expired refresh token.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Query active session record in database
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: rawToken },
      include: {
        user: {
          include: {
            studentProfile: true,
            facultyProfile: true,
            adminProfile: true
          }
        }
      }
    });

    if (!tokenRecord || tokenRecord.userId !== decoded.sub) {
      res.status(401).json({
        status: 'fail',
        message: 'Invalid session. Refresh token not recognized.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check if token has been revoked
    if (tokenRecord.revoked) {
      // Invalidate all remaining active refresh tokens for this user (RFC 6819 defense against stolen token reuse)
      await prisma.refreshToken.updateMany({
        where: {
          userId: tokenRecord.userId,
          revoked: false
        },
        data: { revoked: true }
      });

      await prisma.auditLog.create({
        data: {
          userId: tokenRecord.userId,
          action: 'AUTH_TOKEN_REUSE_DETECTED',
          resource: 'auth/refresh',
          details: JSON.stringify({ reason: 'REVOKED_TOKEN_PRESENTED_ALL_SESSIONS_INVALIDATED' }),
          ipAddress: clientIp,
          userAgent
        }
      });

      // Clear the cookie on client side as well using matching cookie attributes
      res.clearCookie(REFRESH_COOKIE_NAME, getClearCookieOptions());

      res.status(401).json({
        status: 'fail',
        message: 'Session has been revoked. Please log in again.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check expiration
    if (tokenRecord.expiresAt < new Date()) {
      res.status(401).json({
        status: 'fail',
        message: 'Session has expired. Please log in again.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { user } = tokenRecord;

    if (!user.isActive) {
      res.status(403).json({
        status: 'fail',
        message: 'Account has been deactivated. Please contact an administrator.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const profile = user.studentProfile || user.facultyProfile || user.adminProfile;

    // Perform atomic token rotation inside an interactive transaction
    const newRefreshToken = signRefreshToken({ id: user.id });
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      // 1. Revoke the existing refresh token
      await tx.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { revoked: true }
      });

      // 2. Insert the new rotated refresh token
      await tx.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: user.id,
          expiresAt: newExpiresAt
        }
      });
    });

    const newAccessToken = signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      profileId: profile?.id
    });

    // Send updated cookie
    res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, getRefreshCookieOptions());

    res.status(200).json({
      status: 'success',
      data: {
        accessToken: newAccessToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/logout
 */
export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;

    if (rawToken && typeof rawToken === 'string') {
      // Revoke the refresh session in database
      await prisma.refreshToken.updateMany({
        where: { token: rawToken },
        data: { revoked: true }
      });
    }

    // Clear cookie with exact same matching options as when set
    res.clearCookie(REFRESH_COOKIE_NAME, getClearCookieOptions());

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully.',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/auth/me
 */
export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'fail',
        message: 'Authentication required.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        studentProfile: true,
        facultyProfile: true,
        adminProfile: true
      }
    });

    if (!user) {
      res.status(404).json({
        status: 'fail',
        message: 'User profile not found.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
}
