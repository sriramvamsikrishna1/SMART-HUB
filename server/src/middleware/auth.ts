import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../db/prisma';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  profileId?: string;
  identifier?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Middleware that validates the Bearer access token and confirms the user
 * exists and is active in the database.
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      status: 'fail',
      message: 'Authentication required. No authorization header provided.',
      timestamp: new Date().toISOString()
    });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({
      status: 'fail',
      message: 'Authentication required. Authorization header must follow format: Bearer <token>',
      timestamp: new Date().toISOString()
    });
    return;
  }

  const token = parts[1];

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err: any) {
    res.status(401).json({
      status: 'fail',
      message: err.message || 'Authentication failed. Invalid or expired access token.',
      timestamp: new Date().toISOString()
    });
    return;
  }

  try {
    // Database verification: Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        studentProfile: { select: { id: true, studentId: true } },
        facultyProfile: { select: { id: true, facultyId: true } },
        adminProfile: { select: { id: true, adminCode: true } }
      }
    });

    if (!user) {
      res.status(401).json({
        status: 'fail',
        message: 'Authentication failed. Associated user account no longer exists.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        status: 'fail',
        message: 'Access denied. Account has been deactivated. Please contact an administrator.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Attach sanitized, typed identity to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      profileId:
        user.studentProfile?.id ||
        user.facultyProfile?.id ||
        user.adminProfile?.id,
      identifier:
        user.studentProfile?.studentId ||
        user.facultyProfile?.facultyId ||
        user.adminProfile?.adminCode
    };

    next();
  } catch (dbErr: any) {
    next(dbErr);
  }
}

/**
 * Middleware factory that enforces server-side role-based access control.
 * Rejects requests if req.user does not match any of the permitted roles.
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        status: 'fail',
        message: 'Authentication required prior to role verification.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        status: 'fail',
        message: 'Access denied. You do not have permission to access this resource.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    next();
  };
}
