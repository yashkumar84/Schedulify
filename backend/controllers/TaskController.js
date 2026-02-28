const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { Roles, ApprovalStatus } = require('../config/global');
const sendEmail = require('../helpers/mail');
const { getTaskStatusUpdateTemplate } = require('../helpers/mailTemplates');
const { logActivity } = require('../helpers/activity');

const createTask = async (req, res) => {
  try {
    const { title, description, project: projectId, assignedTo, priority, startDate, dueDate } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    // No specific restricted assignment roles in the simplified system
    // SUPER_ADMIN and TEAM_MEMBER can assign tasks freely.
    if (assignedTo) {
      const targetUser = await User.findById(assignedTo);
      if (!targetUser) return res.status(404).json({ message: 'Assigned user not found' });
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
      // Every task needs Super Admin Approval (except maybe if Super Admin creates it?)
      // User said "every task need Super Amdin Approval", I'll auto-approve Super Admin's own tasks for sanity unless specifically told otherwise.
      approvalStatus: userRole === Roles.SUPER_ADMIN ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING,
      approvedBy: userRole === Roles.SUPER_ADMIN ? userId : undefined,
      approvedAt: userRole === Roles.SUPER_ADMIN ? new Date() : undefined,
      activityLog: [{
        user: userId,
        action: 'Created the task'
      }]
    });

    const createdTask = await task.save();
    await createdTask.populate('createdBy', 'name email role');
    if (assignedTo) await createdTask.populate('assignedTo', 'name email role');

    // Log Activity
    await logActivity({
      user: userId,
      project: projectId,
      task: createdTask._id,
      action: 'created',
      entityType: 'TASK',
      entityName: title,
      description: `Task "${title}" was created by ${req.user.name} and is ${task.approvalStatus}`
    });

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
    const { status, remark, rk, ...otherUpdates } = req.body;
    const finalRemark = remark || rk;

    const task = await Task.findById(req.params.id)
      .populate('project')
      .populate('assignedTo', 'name email');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const userId = req.user._id;
    const userRole = req.user.role;
    const isProjectManager = task.project && task.project.manager && task.project.manager.toString() === userId.toString();
    const isAdmin = userRole === Roles.SUPER_ADMIN;

    // Restriction: Only Admin or Project Manager can mark as completed
    if (status === 'completed' && !isAdmin && !isProjectManager) {
      return res.status(403).json({ message: 'Only an Admin or Project Manager can complete tasks' });
    }

    const oldStatus = task.status;
    const isStatusChanging = status && status !== oldStatus;

    // Apply updates
    if (status) task.status = status;
    Object.assign(task, otherUpdates);

    if (isStatusChanging || finalRemark) {
      let actionText = `Updated task`;
      if (isStatusChanging) {
        actionText = `Changed status from ${oldStatus} to ${task.status}`;
      }
      if (finalRemark) {
        actionText += ` | Remark: ${finalRemark}`;
      }

      task.activityLog.push({
        user: userId,
        action: actionText
      });

      // Log Activity to central log
      await logActivity({
        user: userId,
        project: task.project?._id,
        task: task._id,
        action: isStatusChanging ? 'updated_status' : 'updated',
        entityType: 'TASK',
        entityName: task.title,
        description: actionText
      });
    }

    const updatedTask = await task.save();

    // Notifications logic
    if (isStatusChanging) {
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

        const recipientUsers = await User.find({ _id: { $in: Array.from(recipients) } });

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
          recipientUsers.forEach(async (recipient) => {
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
const getProjectTasks = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const projectId = req.params.projectId;

    let query = { project: projectId };

    // Check if user is the project's manager
    const project = await Project.findById(projectId);
    const isProjectManager = project && project.manager && project.manager.toString() === userId.toString();

    // Filter based on user role
    if (userRole === Roles.SUPER_ADMIN || isProjectManager) {
      // Admins and PMs see all tasks in the project
    } else {
      // Team members see approved tasks OR tasks they created OR tasks assigned to them
      query = {
        project: projectId,
        $or: [
          { approvalStatus: ApprovalStatus.APPROVED },
          { createdBy: userId },
          { assignedTo: userId }
        ]
      };
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
const getAdminAllTasks = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;

    let query = {};

    if (userRole === Roles.SUPER_ADMIN) {
      // Full visibility
    } else if (userRole === Roles.TEAM_MEMBER) {
      // Filter projects they manage OR tasks they created OR tasks assigned to them
      const managedProjects = await Project.find({ manager: userId }).select('_id');
      const projectIds = managedProjects.map(p => p._id);

      query = {
        $or: [
          { project: { $in: projectIds } },
          { createdBy: userId },
          { assignedTo: userId }
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

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin/Project Manager)
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const taskTitle = task.title;
    const projectId = task.project;

    await task.deleteOne();

    // Log Activity
    await logActivity({
      user: req.user.id,
      project: projectId,
      action: 'deleted',
      entityType: 'TASK',
      entityName: taskTitle,
      description: `Task "${taskTitle}" was deleted by ${req.user.name}`
    });

    res.json({ message: 'Task removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const taskId = req.params.id;
    const userId = req.user._id;

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.comments.push({
      user: userId,
      text: text
    });

    task.activityLog.push({
      user: userId,
      action: `Added a comment: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`
    });

    await task.save();

    // Populate user details for the new comment
    const updatedTask = await Task.findById(taskId)
      .populate('comments.user', 'name email role')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email role')
      .populate('approvedBy', 'name email');

    // Notify assigned user if someone else commented
    if (task.assignedTo && task.assignedTo.toString() !== userId.toString()) {
      const notification = new Notification({
        recipient: task.assignedTo,
        sender: userId,
        type: 'TASK_COMMENT',
        message: `${req.user.name} commented on task "${task.title}"`,
        link: `/tasks?project=${task.project}`
      });
      const savedNotification = await notification.save();

      // Real-time broadcast
      const { sendNotification } = require('../lib/socket');
      sendNotification(task.assignedTo.toString(), {
        _id: savedNotification._id,
        type: savedNotification.type,
        message: savedNotification.message,
        link: savedNotification.link,
        createdAt: savedNotification.createdAt,
        sender: { name: req.user.name }
      });
    }

    res.status(201).json(updatedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createTask,
  updateTaskStatus,
  getProjectTasks,
  getAdminAllTasks,
  approveTask,
  rejectTask,
  getPendingTasks,
  deleteTask,
  addComment
};
