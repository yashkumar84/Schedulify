const express = require('express');
const router = express.Router();
const {
  createTask,
  updateTaskStatus,
  getProjectTasks,
  approveTask,
  rejectTask,
  getPendingTasks
} = require('../controllers/TaskController');
const { authenticate, authorize } = require('../helpers/auth');
const { Roles } = require('../config/global');
const { validate, taskSchema } = require('../validations');

router.post('/', authenticate, authorize(Roles.SUPER_ADMIN, Roles.PROJECT_MANAGER), validate(taskSchema), createTask);
router.put('/:id/status', authenticate, updateTaskStatus);
router.get('/project/:projectId', authenticate, getProjectTasks);

// Approval routes (Admin only)
router.get('/pending', authenticate, authorize(Roles.SUPER_ADMIN), getPendingTasks);
router.put('/:id/approve', authenticate, authorize(Roles.SUPER_ADMIN), approveTask);
router.put('/:id/reject', authenticate, authorize(Roles.SUPER_ADMIN), rejectTask);

module.exports = router;
