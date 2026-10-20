import { Router } from 'express';
import { login, refresh, logout, getMe } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';

export const authRouter = Router();

// Authentication Endpoints
authRouter.post('/login', authRateLimiter, login);
authRouter.post('/refresh', refresh);
authRouter.post('/logout', logout);
authRouter.get('/me', authenticate, getMe);
