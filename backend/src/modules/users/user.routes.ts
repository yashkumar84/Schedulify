import { Router } from 'express';
import { UserController } from './user.controller';
import { authenticate } from '../../common/middleware/auth.middleware';

const router = Router();
const userController = new UserController();

router.get('/profile', authenticate as any, userController.getProfile);
router.put('/profile', authenticate as any, userController.updateProfile);
router.put('/change-password', authenticate as any, userController.changePassword);

export default router;
