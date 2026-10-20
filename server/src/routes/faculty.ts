import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth';
import { getFacultyProfile, getFacultyDepartmentOverview } from '../controllers/facultyController';

export const facultyRouter = Router();

// Strictly enforce authentication and FACULTY / ADMIN roles
facultyRouter.use(authenticate, requireRole(Role.FACULTY, Role.ADMIN));

// Faculty Profile Endpoint
facultyRouter.get('/profile', getFacultyProfile);

// Contextual Department Overview Endpoint
facultyRouter.get('/overview', getFacultyDepartmentOverview);
