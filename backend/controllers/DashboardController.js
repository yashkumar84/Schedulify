const Project = require('../models/Project');
const Task = require('../models/Task');
const Expense = require('../models/Expense');
const { Roles } = require('../config/global');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
const getStats = async (req, res) => {
    try {
        const projects = await Project.find();
        const tasks = await Task.find();
        const expenses = await Expense.find({ status: 'approved' });

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
        const recentActivity = tasks.slice(0, 5).map(t => ({
            userName: 'System', // Could be expanded to actual user names
            action: 'updated task',
            target: t.title,
            time: 'Just now',
            project: projects.find(p => p._id.toString() === t.project.toString())?.name || 'Unknown'
        }));

        res.json({
            totalProjects,
            completedTasks: `${completedTasks}/${totalTasks}`,
            totalBudget: `$${totalBudget.toLocaleString()}`,
            overdueTasks,
            activeProjects,
            recentActivity,
            finance: {
                totalBudget,
                totalSpent,
                remainingBudget: totalBudget - totalSpent,
                expenseApprovalStatus: 'Pending reviews available'
            },
            progressPercentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getStats
};
