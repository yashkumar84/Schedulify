const Activity = require('../models/Activity');
const { Roles } = require('../config/global');
const Project = require('../models/Project');

// @desc    Get all activities (RBAC filtered)
// @route   GET /api/activities
// @access  Private
const getActivities = async (req, res) => {
    try {
        const { id: userId, role: userRole } = req.user;
        const { projectId } = req.query;

        let query = {};

        // Filter by project if specified
        if (projectId) {
            query.project = projectId;

            // Access check for specific project if not Admin
            if (userRole !== Roles.SUPER_ADMIN) {
                const project = await Project.findById(projectId);
                if (!project) return res.status(404).json({ message: 'Project not found' });

                const isManager = project.manager.toString() === userId;
                const isCollaborator = project.collaborators?.some(c => c.toString() === userId);

                if (!isManager && !isCollaborator) {
                    return res.status(403).json({ message: 'Not authorized to view activities for this project' });
                }
            }
        } else if (userRole !== Roles.SUPER_ADMIN) {
            // If no project specified and not Admin, show only his related projects' activities
            const projects = await Project.find({
                $or: [
                    { manager: userId },
                    { collaborators: userId }
                ]
            });
            const projectIds = projects.map(p => p._id);
            query.project = { $in: projectIds };
        }

        const activities = await Activity.find(query)
            .populate('user', 'name email role')
            .populate('project', 'name')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getActivities };
