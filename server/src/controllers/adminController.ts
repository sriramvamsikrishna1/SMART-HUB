import { Request, Response, NextFunction } from 'express';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { prisma } from '../db/prisma';
import {
  validateStudentInput,
  validateFacultyInput,
  validateAdminInput
} from '../utils/adminValidation';

const SALT_ROUNDS = 12;

/**
 * POST /api/v1/admin/students
 * Provisions a new student account and linked StudentProfile
 */
export async function provisionStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
  const clientIp = req.ip || req.socket?.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const adminId = req.user?.id;

  try {
    const validation = validateStudentInput(req.body);
    if (!validation.isValid || !validation.data) {
      res.status(400).json({
        status: 'fail',
        message: validation.error || 'Invalid student data.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { studentId, firstName, lastName, email, department, batchYear, semester, section, password } =
      validation.data;

    // Check duplicate studentId
    const existingStudent = await prisma.studentProfile.findUnique({
      where: { studentId }
    });
    if (existingStudent) {
      res.status(409).json({
        status: 'fail',
        message: `A student with roll number ${studentId} already exists.`,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check duplicate email
    const existingEmail = await prisma.user.findUnique({
      where: { email }
    });
    if (existingEmail) {
      res.status(409).json({
        status: 'fail',
        message: `A user with email ${email} already exists.`,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Hash password with bcryptjs
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user and profile in an atomic transaction
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: Role.STUDENT,
        isActive: true,
        studentProfile: {
          create: {
            studentId,
            firstName,
            lastName,
            department,
            batchYear,
            semester,
            section
          }
        }
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        studentProfile: true
      }
    });

    // Record audit event
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'ADMIN_PROVISION_STUDENT',
        resource: `student:${studentId}`,
        details: JSON.stringify({ studentId, department, batchYear }),
        ipAddress: clientIp,
        userAgent
      }
    });

    res.status(201).json({
      status: 'success',
      message: `Student account for ${firstName} ${lastName} (${studentId}) provisioned successfully.`,
      data: {
        user: newUser
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/admin/faculty
 * Provisions a new faculty account and linked FacultyProfile
 */
export async function provisionFaculty(req: Request, res: Response, next: NextFunction): Promise<void> {
  const clientIp = req.ip || req.socket?.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const adminId = req.user?.id;

  try {
    const validation = validateFacultyInput(req.body);
    if (!validation.isValid || !validation.data) {
      res.status(400).json({
        status: 'fail',
        message: validation.error || 'Invalid faculty data.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { facultyId, firstName, lastName, email, department, designation, specialization, password } =
      validation.data;

    // Check duplicate facultyId
    const existingFaculty = await prisma.facultyProfile.findUnique({
      where: { facultyId }
    });
    if (existingFaculty) {
      res.status(409).json({
        status: 'fail',
        message: `A faculty member with ID ${facultyId} already exists.`,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check duplicate email
    const existingEmail = await prisma.user.findUnique({
      where: { email }
    });
    if (existingEmail) {
      res.status(409).json({
        status: 'fail',
        message: `A user with email ${email} already exists.`,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Hash password with bcryptjs
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user and profile atomically
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: Role.FACULTY,
        isActive: true,
        facultyProfile: {
          create: {
            facultyId,
            firstName,
            lastName,
            department,
            designation,
            specialization
          }
        }
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        facultyProfile: true
      }
    });

    // Record audit event
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'ADMIN_PROVISION_FACULTY',
        resource: `faculty:${facultyId}`,
        details: JSON.stringify({ facultyId, department, designation }),
        ipAddress: clientIp,
        userAgent
      }
    });

    res.status(201).json({
      status: 'success',
      message: `Faculty account for ${firstName} ${lastName} (${facultyId}) provisioned successfully.`,
      data: {
        user: newUser
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/admin/admins
 * Provisions a secondary administrative account and linked AdminProfile
 */
export async function provisionAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const clientIp = req.ip || req.socket?.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const adminId = req.user?.id;

  try {
    const validation = validateAdminInput(req.body);
    if (!validation.isValid || !validation.data) {
      res.status(400).json({
        status: 'fail',
        message: validation.error || 'Invalid administrator data.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { adminCode, firstName, lastName, email, department, password } = validation.data;

    // Check duplicate adminCode
    const existingAdmin = await prisma.adminProfile.findUnique({
      where: { adminCode }
    });
    if (existingAdmin) {
      res.status(409).json({
        status: 'fail',
        message: `An administrator with code ${adminCode} already exists.`,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check duplicate email
    const existingEmail = await prisma.user.findUnique({
      where: { email }
    });
    if (existingEmail) {
      res.status(409).json({
        status: 'fail',
        message: `A user with email ${email} already exists.`,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Hash password with bcryptjs
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: Role.ADMIN,
        isActive: true,
        adminProfile: {
          create: {
            adminCode,
            firstName,
            lastName,
            department
          }
        }
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        adminProfile: true
      }
    });

    // Record audit event
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'ADMIN_PROVISION_ADMIN',
        resource: `admin:${adminCode}`,
        details: JSON.stringify({ adminCode, department }),
        ipAddress: clientIp,
        userAgent
      }
    });

    res.status(201).json({
      status: 'success',
      message: `Administrator account for ${firstName} ${lastName} (${adminCode}) provisioned successfully.`,
      data: {
        user: newUser
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/admin/stats
 * Aggregates high-level system user statistics for the dashboard
 */
export async function getDashboardStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [totalUsers, totalStudents, totalFaculty, totalAdmins, activeUsers, inactiveUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: Role.STUDENT } }),
      prisma.user.count({ where: { role: Role.FACULTY } }),
      prisma.user.count({ where: { role: Role.ADMIN } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } })
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        totalUsers,
        totalStudents,
        totalFaculty,
        totalAdmins,
        activeUsers,
        inactiveUsers
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/admin/users
 * Lists users with optional role filtering, search, and pagination
 */
export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const roleParam = req.query.role as string | undefined;
    const searchParam = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (roleParam && ['STUDENT', 'FACULTY', 'ADMIN'].includes(roleParam)) {
      where.role = roleParam as Role;
    }

    if (searchParam) {
      where.OR = [
        { email: { contains: searchParam, mode: 'insensitive' } },
        { studentProfile: { studentId: { contains: searchParam, mode: 'insensitive' } } },
        { studentProfile: { firstName: { contains: searchParam, mode: 'insensitive' } } },
        { studentProfile: { lastName: { contains: searchParam, mode: 'insensitive' } } },
        { facultyProfile: { facultyId: { contains: searchParam, mode: 'insensitive' } } },
        { facultyProfile: { firstName: { contains: searchParam, mode: 'insensitive' } } },
        { facultyProfile: { lastName: { contains: searchParam, mode: 'insensitive' } } },
        { adminProfile: { adminCode: { contains: searchParam, mode: 'insensitive' } } },
        { adminProfile: { firstName: { contains: searchParam, mode: 'insensitive' } } },
        { adminProfile: { lastName: { contains: searchParam, mode: 'insensitive' } } }
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          studentProfile: true,
          facultyProfile: true,
          adminProfile: true
        }
      })
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/v1/admin/users/:id/status
 * Enables or disables a user account
 */
export async function toggleUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { id } = req.params;
  const { isActive } = req.body;
  const adminId = req.user?.id;
  const clientIp = req.ip || req.socket?.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  if (typeof isActive !== 'boolean') {
    res.status(400).json({
      status: 'fail',
      message: 'isActive must be a boolean value.',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Prevent self-deactivation
  if (id === adminId && !isActive) {
    res.status(400).json({
      status: 'fail',
      message: 'Administrators cannot deactivate their own account.',
      timestamp: new Date().toISOString()
    });
    return;
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: isActive ? 'ADMIN_ACTIVATE_USER' : 'ADMIN_DEACTIVATE_USER',
        resource: `user:${id}`,
        details: JSON.stringify({ newStatus: isActive }),
        ipAddress: clientIp,
        userAgent
      }
    });

    res.status(200).json({
      status: 'success',
      message: `User account status updated to ${isActive ? 'active' : 'inactive'}.`,
      data: {
        user: updated
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
}
