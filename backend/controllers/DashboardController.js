const Project = require('../models/Project');
const Task = require('../models/Task');
const Expense = require('../models/Expense');
// const { Roles } = require('../config/global');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
const getStats = async (req, res) => {
  try {
    const { id: userId, role: userRole } = req.user;
    const { Roles } = require('../config/global');

    let projects = [];
    let tasks = [];
    let expenses = [];

    if (userRole === Roles.SUPER_ADMIN) {
      projects = await Project.find();
      tasks = await Task.find();
      expenses = await Expense.find({ status: 'approved' });
    } else if (userRole === Roles.PROJECT_MANAGER) {
      projects = await Project.find({ manager: userId });
      const projectIds = projects.map(p => p._id);
      tasks = await Task.find({ project: { $in: projectIds }});
      expenses = await Expense.find({ project: { $in: projectIds }, status: 'approved' });
    } else {
      // INHOUSE_TEAM, OUTSOURCED_TEAM, FINANCE_TEAM
      tasks = await Task.find({ assignedTo: userId });
      const projectIds = [...new Set(tasks.map(t => t.project.toString()))];
      projects = await Project.find({ _id: { $in: projectIds }});

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
        name: p.name,
        progress,
        color: colors[idx % 3]
      };
    });

    // Mock recent activity for now or fetch from activity logs
    // Filter activity by user's relevant objects
    const recentActivity = tasks.slice(0, 5).map(t => ({
      userName: 'System',
      action: 'updated task',
      target: t.title,
      time: 'Just now',
      project: projects.find(p => p._id.toString() === t.project.toString())?.name || 'Unknown'
    }));

    res.json({
      totalProjects,
      completedTasks: `${completedTasks}/${totalTasks}`,
      totalBudget: `₹${totalBudget.toLocaleString('en-IN')}`,
      overdueTasks,
      activeProjects,
      recentActivity,
      finance: {
        totalBudget,
        totalSpent,
        remainingBudget: totalBudget - totalSpent,
        expenseApprovalStatus: userRole === Roles.SUPER_ADMIN || userRole === Roles.FINANCE_TEAM ? 'Pending reviews available' : 'Restricted'
      },
      progressPercentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      userRole // Pass role for frontend customization
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStats
};
