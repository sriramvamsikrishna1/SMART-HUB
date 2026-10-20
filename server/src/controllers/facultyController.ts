import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';

/**
 * GET /api/v1/faculty/profile
 * Retrieves the authenticated faculty member's profile record
 */
export async function getFacultyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        status: 'fail',
        message: 'Authentication required.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const faculty = await prisma.facultyProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true
          }
        }
      }
    });

    if (!faculty) {
      res.status(404).json({
        status: 'fail',
        message: 'Faculty profile not found.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: {
        profile: faculty,
        user: faculty.user
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/faculty/overview
 * Returns contextual departmental stats for instructional staff
 */
export async function getFacultyDepartmentOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        status: 'fail',
        message: 'Authentication required.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const faculty = await prisma.facultyProfile.findUnique({
      where: { userId }
    });

    const department = faculty?.department || 'Computer Science and Engineering';

    const [enrolledStudents, departmentFaculty] = await Promise.all([
      prisma.studentProfile.count({
        where: { department }
      }),
      prisma.facultyProfile.count({
        where: { department }
      })
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        department,
        enrolledStudents,
        departmentFaculty
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
}
