const Project = require('../models/Project');
const Task = require('../models/Task');
const Expense = require('../models/Expense');
const Activity = require('../models/Activity');
const { Roles } = require('../config/global');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
const getStats = async (req, res) => {
  try {
    const { id: userId, role: userRole, permissions } = req.user;

    let projects = [];
    let tasks = [];
    let expenses = [];

    if (userRole === Roles.SUPER_ADMIN) {
      projects = await Project.find();
      tasks = await Task.find();
      expenses = await Expense.find({ status: 'approved' });
    } else {
      // Team members: filter by project membership
      projects = await Project.find({
        $or: [
          { manager: userId },
          { collaborators: userId }
        ]
      });
      const projectIds = projects.map(p => p._id);

      tasks = await Task.find({
        $or: [
          { project: { $in: projectIds } },
          { assignedTo: userId }
        ]
      });

      // Only load finance data if user has finance.read permission
      if (permissions && permissions.finance && permissions.finance.read) {
        expenses = await Expense.find({ status: 'approved' });
      } else {
        expenses = await Expense.find({ project: { $in: projectIds }, status: 'approved' });
      }
    }

    const totalProjects = projects.length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const overdueTasks = tasks.filter(t =>
      t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < new Date()
    ).length;

    const totalBudget = projects.reduce((acc, p) => acc + (p.budget || 0), 0);
    const totalSpent = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

    const activeProjects = projects.slice(0, 3).map((p, idx) => {
      const projectTasks = tasks.filter(t => t.project.toString() === p._id.toString());
      const completed = projectTasks.filter(t => t.status === 'completed').length;
      const progress = projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;
      const colors = ['bg-primary-500', 'bg-emerald-500', 'bg-amber-500'];
      return { id: p._id, name: p.name, progress, color: colors[idx % 3] };
    });

    let activityQuery = {};
    if (userRole !== Roles.SUPER_ADMIN) {
      const relevantProjectIds = projects.map(p => p._id);
      activityQuery = { project: { $in: relevantProjectIds } };
    }

    const activities = await Activity.find(activityQuery)
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    const recentActivity = activities.map(a => ({
      userName: a.user?.name || 'Unknown',
      action: a.action,
      target: a.entityName,
      time: a.createdAt,
      project: a.project?.name || 'System'
    }));

    const isSuperAdmin = userRole === Roles.SUPER_ADMIN;
    const hasFinanceRead = isSuperAdmin || (permissions && permissions.finance && permissions.finance.read);

    const response = {
      totalProjects,
      completedTasks: `${completedTasks}/${totalTasks}`,
      totalBudget: isSuperAdmin ? `₹${totalBudget.toLocaleString('en-IN')}` : null,
      overdueTasks,
      activeProjects,
      recentActivity,
      finance: isSuperAdmin ? {
        totalBudget,
        totalSpent,
        remainingBudget: totalBudget - totalSpent,
        expenseApprovalStatus: 'Pending reviews available'
      } : hasFinanceRead ? {
        totalSpent,
        expenseApprovalStatus: permissions.finance.update ? 'Pending reviews available' : 'View Only'
      } : null,
      progressPercentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      userRole,
      permissions: permissions || {}
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getStats };
