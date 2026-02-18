import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate, authorize } from '../../common/middleware/auth.middleware';
import { UserRole } from '../../common/types/user';

const router = Router();
const authController = new AuthController();

// Only SUPER_ADMIN can register new users
router.post('/register', authenticate, authorize([UserRole.SUPER_ADMIN]), (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));
router.get('/me', authenticate, (req, res) => authController.getCurrentUser(req, res));

export default router;
