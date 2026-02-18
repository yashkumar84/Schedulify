import { Router } from 'express';
import { ProjectController } from './project.controller';
import { authenticate, authorize } from '../../common/middleware/auth.middleware';
import { UserRole } from '../../common/types/user';

const router = Router();
const projectController = new ProjectController();

// All project routes require authentication
router.use(authenticate);

router.get('/', projectController.getAllProjects);
router.get('/:id', projectController.getProjectById);

// Only Super Admin and Project Manager can create or modify projects
router.post('/', authorize([UserRole.SUPER_ADMIN, UserRole.PROJECT_MANAGER]), projectController.createProject);
router.put('/:id', authorize([UserRole.SUPER_ADMIN, UserRole.PROJECT_MANAGER]), projectController.updateProject);
router.delete('/:id', authorize([UserRole.SUPER_ADMIN]), projectController.deleteProject);

export default router;
