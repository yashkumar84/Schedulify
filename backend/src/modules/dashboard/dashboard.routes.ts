import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authenticate } from '../../common/middleware/auth.middleware';

const router = Router();
const dashboardController = new DashboardController();

router.get('/stats', authenticate, (req, res) => dashboardController.getStats(req, res));

export default router;
