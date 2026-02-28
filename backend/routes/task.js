const express = require('express');
const router = express.Router();
const {
  createTask,
  updateTaskStatus,
  getProjectTasks,
  getAdminAllTasks,
  approveTask,
  rejectTask,
  getPendingTasks,
  deleteTask
} = require('../controllers/TaskController');
const { authenticate, authorize, checkPermission } = require('../helpers/auth');
const { Roles } = require('../config/global');
const { validate, taskSchema } = require('../validations');

// Order matters: specific routes before parameterized routes
router.get('/all', authenticate, checkPermission('tasks', 'read'), getAdminAllTasks);
// No permission gate here: the controller itself handles role-based visibility
// (admin = all tasks, project manager = all tasks, team member = only their own)
router.get('/project/:projectId', authenticate, getProjectTasks);

// Task approval routes — Super Admin only (approval workflow unchanged)
router.get('/pending', authenticate, authorize(Roles.SUPER_ADMIN), getPendingTasks);
router.put('/:id/approve', authenticate, authorize(Roles.SUPER_ADMIN), approveTask);
router.put('/:id/reject', authenticate, authorize(Roles.SUPER_ADMIN), rejectTask);

router.post('/', authenticate, checkPermission('tasks', 'create'), validate(taskSchema), createTask);
router.put('/:id', authenticate, checkPermission('tasks', 'update'), updateTaskStatus);
router.delete('/:id', authenticate, checkPermission('tasks', 'delete'), deleteTask);

module.exports = router;
