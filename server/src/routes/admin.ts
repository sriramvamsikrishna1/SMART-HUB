import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth';
import {
  getDashboardStats,
  provisionStudent,
  provisionFaculty,
  provisionAdmin,
  listUsers,
  toggleUserStatus
} from '../controllers/adminController';

export const adminRouter = Router();

// Enforce authentication and ADMIN role requirement across all admin routes
adminRouter.use(authenticate, requireRole(Role.ADMIN));

// Overview Metrics Endpoint
adminRouter.get('/stats', getDashboardStats);

// Account Provisioning Endpoints
adminRouter.post('/students', provisionStudent);
adminRouter.post('/faculty', provisionFaculty);
adminRouter.post('/admins', provisionAdmin);

// User Management Endpoints
adminRouter.get('/users', listUsers);
adminRouter.patch('/users/:id/status', toggleUserStatus);
