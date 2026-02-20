const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { Roles, ApprovalStatus } = require('../config/global');
const sendEmail = require('../helpers/mail');
const { getTaskStatusUpdateTemplate } = require('../helpers/mailTemplates');

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Super Admin Only per user request)
const createTask = async(req, res) => {
  try {
    const { title, description, project: projectId, assignedTo, priority, startDate, dueDate } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    // RBAC: Only Super Admin can create tasks per latest user request
    if (userRole !== Roles.SUPER_ADMIN) {
      return res.status(403).json({ message: 'Only Super Admin can create tasks' });
    }

    const task = new Task({
      title,
      description,
      project: projectId,
      assignedTo,
      priority,
      startDate,
      dueDate,
      createdBy: userId,
      approvalStatus: ApprovalStatus.APPROVED, // Auto-approve for Super Admin
      approvedBy: userId,
      approvedAt: new Date(),
      activityLog: [{
        user: userId,
        action: 'Created the task'
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
const updateTaskStatus = async(req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project')
      .populate('assignedTo', 'name email');

    if (task) {
      const oldStatus = task.status;
      task.status = req.body.status || task.status;

      task.activityLog.push({
        user: req.user._id,
        action: `Changed status from ${oldStatus} to ${task.status}`
      });

      const updatedTask = await task.save();

      // Notifications logic
      try {
        const superAdmins = await User.find({ role: Roles.SUPER_ADMIN });
        const recipients = new Set();

        // Notify Project Manager
        if (task.project && task.project.manager) {
          recipients.add(task.project.manager.toString());
        }

        // Notify Super Admins
        superAdmins.forEach(admin => recipients.add(admin._id.toString()));

        // Also notify assigned user if someone else updated it
        if (task.assignedTo && task.assignedTo._id.toString() !== req.user._id.toString()) {
          recipients.add(task.assignedTo._id.toString());
        }

        // Remove current user from recipients
        recipients.delete(req.user._id.toString());

        const recipientUsers = await User.find({ _id: { $in: Array.from(recipients) }});

        const notifications = recipientUsers.map(recipient => ({
          recipient: recipient._id,
          sender: req.user._id,
          type: 'TASK_STATUS_CHANGE',
          message: `${req.user.name} updated task "${task.title}" to ${task.status}`,
          link: `/tasks?project=${task.project._id || task.project}`
        }));

        if (notifications.length > 0) {
          const savedNotifications = await Notification.insertMany(notifications);

          // Real-time broadcast
          const { sendNotification } = require('../lib/socket');
          savedNotifications.forEach(n => {
            sendNotification(n.recipient.toString(), {
              _id: n._id,
              type: n.type,
              message: n.message,
              link: n.link,
              createdAt: n.createdAt,
              sender: { name: req.user.name }
            });
          });

          // Email Notifications
          recipientUsers.forEach(async(recipient) => {
            try {
              if (recipient.email) {
                await sendEmail({
                  email: recipient.email,
                  subject: `Task Status Update: ${task.title}`,
                  html: getTaskStatusUpdateTemplate(task, oldStatus, task.status, req.user)
                });
              }
            } catch (emailErr) {
              console.error(`Email failed for ${recipient.email}:`, emailErr);
            }
          });
        }
      } catch (notifyErr) {
        console.error('Notification error:', notifyErr);
      }

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
const getProjectTasks = async(req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const projectId = req.params.projectId;

    let query = { project: projectId };

    // Filter based on user role
    if (userRole === Roles.SUPER_ADMIN) {
      // Admins see all tasks
    } else if (userRole === Roles.PROJECT_MANAGER) {
      // PMs see tasks they created OR approved tasks
      query = {
        project: projectId,
        $or: [
          { createdBy: userId },
          { approvalStatus: ApprovalStatus.APPROVED }
        ]
      };
    } else if (userRole === Roles.INHOUSE_TEAM || userRole === Roles.OUTSOURCED_TEAM) {
      // Team members only see tasks assigned to them
      query = {
        project: projectId,
        assignedTo: userId,
        approvalStatus: ApprovalStatus.APPROVED
      };
    } else {
      // Other roles (e.g., FINANCE) see approved tasks
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

// @desc    Get all tasks across all projects (Admin/PM only)
// @route   GET /api/tasks/all
// @access  Private (SUPER_ADMIN, PROJECT_MANAGER)
const getAdminAllTasks = async(req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;

    let query = {};

    if (userRole === Roles.SUPER_ADMIN) {
      // Full visibility
    } else if (userRole === Roles.PROJECT_MANAGER) {
      // Filter projects they manage OR tasks they created
      const managedProjects = await Project.find({ manager: userId }).select('_id');
      const projectIds = managedProjects.map(p => p._id);

      query = {
        $or: [
          { project: { $in: projectIds }},
          { createdBy: userId }
        ]
      };
    } else {
      return res.status(403).json({ message: 'Not authorized for global task view' });
    }

    const tasks = await Task.find(query)
      .populate('project', 'name clientName')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve a pending task
// @route   PUT /api/tasks/:id/approve
// @access  Private (SUPER_ADMIN only)
const approveTask = async(req, res) => {
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
    task.rejectionReason = undefined;

    task.activityLog.push({
      user: req.user._id,
      action: 'Approved the task'
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
const rejectTask = async(req, res) => {
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
      action: `Rejected the task: ${reason}`
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
const getPendingTasks = async(req, res) => {
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
  getAdminAllTasks,
  approveTask,
  rejectTask,
  getPendingTasks
};
