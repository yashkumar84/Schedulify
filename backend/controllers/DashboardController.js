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
    const { id: userId, role: userRole } = req.user;

    let projects = [];
    let tasks = [];
    let expenses = [];

    if (userRole === Roles.SUPER_ADMIN) {
      projects = await Project.find();
      tasks = await Task.find();
      expenses = await Expense.find({ status: 'approved' });
    } else {
      // Find all projects where user is manager or collaborator
      projects = await Project.find({
        $or: [
          { manager: userId },
          { collaborators: userId }
        ]
      });
      const projectIds = projects.map(p => p._id);

      // Tasks: Show all tasks for these projects, plus any tasks specifically assigned to the user (in case they aren't on the project?)
      // Usually task is within project, so $in projectIds covers most.
      tasks = await Task.find({
        $or: [
          { project: { $in: projectIds } },
          { assignedTo: userId }
        ]
      });

      if (userRole === Roles.FINANCE_TEAM) {
        expenses = await Expense.find({ status: 'approved' });
      } else {
        expenses = await Expense.find({ project: { $in: projectIds }, status: 'approved' });
      }
    }

    const totalProjects = projects.length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const overdueTasks = tasks.filter(t => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < new Date()).length;

    const totalBudget = projects.reduce((acc, p) => acc + (p.budget || 0), 0);
    const totalSpent = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

    // Map active projects for dashboard
    const activeProjects = projects.slice(0, 3).map((p, idx) => {
      const projectTasks = tasks.filter(t => t.project.toString() === p._id.toString());
      const completed = projectTasks.filter(t => t.status === 'completed').length;
      const progress = projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;
      const colors = ['bg-primary-500', 'bg-emerald-500', 'bg-amber-500'];
      return {
        id: p._id,
        name: p.name,
        progress,
        color: colors[idx % 3]
      };
    });

    // Fetch real activities
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

    const response = {
      totalProjects,
      completedTasks: `${completedTasks}/${totalTasks}`,
      totalBudget: userRole === Roles.SUPER_ADMIN ? `₹${totalBudget.toLocaleString('en-IN')}` : null,
      overdueTasks,
      activeProjects,
      recentActivity,
      finance: userRole === Roles.SUPER_ADMIN ? {
        totalBudget,
        totalSpent,
        remainingBudget: totalBudget - totalSpent,
        expenseApprovalStatus: 'Pending reviews available'
      } : {
        totalSpent,
        expenseApprovalStatus: userRole === Roles.FINANCE_TEAM ? 'Pending reviews available' : 'Restricted'
      },
      progressPercentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      userRole // Pass role for frontend customization
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStats
};
