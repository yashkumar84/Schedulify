const Task = require('../models/Task');
const { Roles, ApprovalStatus } = require('../config/global');

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Admin, PM)
const createTask = async (req, res) => {
    try {
        const { title, description, project, assignedTo, priority, startDate, dueDate } = req.body;
        const userId = req.user._id;
        const userRole = req.user.role;

        // Determine approval status based on role
        const approvalStatus = userRole === Roles.SUPER_ADMIN
            ? ApprovalStatus.APPROVED
            : ApprovalStatus.PENDING;

        const task = new Task({
            title,
            description,
            project,
            assignedTo,
            priority,
            startDate,
            dueDate,
            createdBy: userId,
            approvalStatus,
            // Auto-approve for admins
            ...(userRole === Roles.SUPER_ADMIN && {
                approvedBy: userId,
                approvedAt: new Date()
            }),
            activityLog: [{
                user: userId,
                action: userRole === Roles.SUPER_ADMIN
                    ? 'Created and auto-approved the task'
                    : 'Created the task (pending approval)',
            }]
        });

        const createdTask = await task.save();
        await createdTask.populate('createdBy', 'name email role');

        res.status(201).json(createdTask);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update task status
// @route   PUT /api/tasks/:id/status
// @access  Private (Assigned User, PM, Admin)
const updateTaskStatus = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (task) {
            const oldStatus = task.status;
            task.status = req.body.status || task.status;

            task.activityLog.push({
                user: req.user._id,
                action: `Changed status from ${oldStatus} to ${task.status}`,
            });

            const updatedTask = await task.save();
            res.json(updatedTask);
        } else {
            res.status(404).json({ message: 'Task not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all tasks for a project
// @route   GET /api/tasks/project/:projectId
// @access  Private
const getProjectTasks = async (req, res) => {
    try {
        const userId = req.user._id;
        const userRole = req.user.role;
        const projectId = req.params.projectId;

        let query = { project: projectId };

        // Filter based on user role
        if (userRole === Roles.SUPER_ADMIN) {
            // Admins see all tasks (pending, approved, rejected)
            // No additional filter needed
        } else if (userRole === Roles.PROJECT_MANAGER) {
            // PMs see tasks they created OR approved tasks
            query = {
                project: projectId,
                $or: [
                    { createdBy: userId },
                    { approvalStatus: ApprovalStatus.APPROVED }
                ]
            };
        } else {
            // Other roles only see approved tasks
            query.approvalStatus = ApprovalStatus.APPROVED;
        }

        const tasks = await Task.find(query)
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email role')
            .populate('approvedBy', 'name email')
            .sort({ createdAt: -1 });

        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve a pending task
// @route   PUT /api/tasks/:id/approve
// @access  Private (SUPER_ADMIN only)
const approveTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (task.approvalStatus === ApprovalStatus.APPROVED) {
            return res.status(400).json({ message: 'Task is already approved' });
        }

        task.approvalStatus = ApprovalStatus.APPROVED;
        task.approvedBy = req.user._id;
        task.approvedAt = new Date();
        task.rejectionReason = undefined; // Clear any previous rejection reason

        task.activityLog.push({
            user: req.user._id,
            action: 'Approved the task',
        });

        const updatedTask = await task.save();
        await updatedTask.populate('createdBy approvedBy assignedTo', 'name email role');

        res.json(updatedTask);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Reject a pending task
// @route   PUT /api/tasks/:id/reject
// @access  Private (SUPER_ADMIN only)
const rejectTask = async (req, res) => {
    try {
        const { reason } = req.body;
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (!reason || reason.trim() === '') {
            return res.status(400).json({ message: 'Rejection reason is required' });
        }

        task.approvalStatus = ApprovalStatus.REJECTED;
        task.rejectionReason = reason;
        task.approvedBy = undefined;
        task.approvedAt = undefined;

        task.activityLog.push({
            user: req.user._id,
            action: `Rejected the task: ${reason}`,
        });

        const updatedTask = await task.save();
        await updatedTask.populate('createdBy assignedTo', 'name email role');

        res.json(updatedTask);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all pending tasks
// @route   GET /api/tasks/pending
// @access  Private (SUPER_ADMIN only)
const getPendingTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ approvalStatus: ApprovalStatus.PENDING })
            .populate('createdBy', 'name email role')
            .populate('assignedTo', 'name email')
            .populate('project', 'name clientName')
            .sort({ createdAt: -1 });

        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createTask,
    updateTaskStatus,
    getProjectTasks,
    approveTask,
    rejectTask,
    getPendingTasks,
};
