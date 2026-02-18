import { Router } from 'express';
import { TaskController } from './task.controller';
import { authenticate } from '../../common/middleware/auth.middleware';

const router = Router();
const taskController = new TaskController();

router.use(authenticate);

router.get('/project/:projectId', taskController.getTasksByProject);
router.get('/:id', taskController.getTaskById);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
router.post('/:id/comments', taskController.addComment);

export default router;
