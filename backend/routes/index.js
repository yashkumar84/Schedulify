const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const projectRoutes = require('./project');
const taskRoutes = require('./task');
const financeRoutes = require('./finance');
const teamRoutes = require('./team');
const chatRoutes = require('./chat');
const userRoutes = require('./user');
const notificationRoutes = require('./notification');
const { getStats } = require('../controllers/DashboardController');
const { authenticate } = require('../helpers/auth');

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/finance', financeRoutes);
router.use('/team', teamRoutes);
router.use('/chat', chatRoutes);
router.use('/users', userRoutes);
router.use('/notifications', notificationRoutes);
router.use('/upload', require('./upload'));
router.use('/activities', require('./activity'));
router.get('/dashboard/stats', authenticate, getStats);

module.exports = router;
