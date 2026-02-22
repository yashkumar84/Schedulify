const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const sendEmail = require('../helpers/mail');
const { Roles } = require('../config/global');
const { projectTransformer, projectListTransformer } = require('../transformers/projectTransformer');
const { logActivity } = require('../helpers/activity');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
const getAllProjects = async (req, res) => {
  try {
    const { id, role } = req.user;
    let query = {};

    if (role !== Roles.SUPER_ADMIN) {
      query = {
        $or: [
          { manager: id },
          { collaborators: id }
        ]
      };
    }

    const projects = await Project.find(query)
      .populate('manager', 'name email')
      .populate('collaborators', 'name email')
      .sort({ createdAt: -1 });

    res.json(projectListTransformer(projects, role));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get project by ID with tasks and metrics
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('manager', 'name email')
      .populate('collaborators', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Access check
    const { id, role } = req.user;
    const isManager = project.manager && project.manager._id.toString() === id;
    const isCollaborator = project.collaborators?.some(c => c._id.toString() === id);

    if (role !== Roles.SUPER_ADMIN && !isManager && !isCollaborator) {
      return res.status(403).json({ message: 'Not authorized to view this project' });
    }

    const tasks = await Task.find({ project: project._id });
    res.json(projectTransformer(project, tasks, role));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a project
// @route   POST /api/projects
// @access  Private (Admin/Project Manager)
const createProject = async (req, res) => {
  try {
    const { name, clientName, startDate, endDate, budget, manager, collaborators, description } = req.body;
    const { id: currentUserId, role: currentUserRole } = req.user;

    let projectManagerId = manager;

    // RBAC Logic:
    // If PM creates, they are forced as manager
    // If Super Admin creates, they must specify a manager
    if (currentUserRole === Roles.PROJECT_MANAGER) {
      projectManagerId = currentUserId;
    } else if (currentUserRole === Roles.SUPER_ADMIN) {
      if (!projectManagerId) {
        return res.status(400).json({ message: 'Please select a Project Manager' });
      }
    } else {
      return res.status(403).json({ message: 'Not authorized to create projects' });
    }

    const project = new Project({
      name,
      clientName,
      startDate,
      endDate,
      budget,
      manager: projectManagerId,
      collaborators: collaborators || [],
      description
    });

    const createdProject = await project.save();

    // Fetch details for emails
    const managerUser = await User.findById(projectManagerId);
    const collaboratorUsers = await User.find({ _id: { $in: collaborators || [] } });
    const superAdmins = await User.find({ role: Roles.SUPER_ADMIN });

    // Prepare recipients list (avoid duplicates)
    const recipientMap = new Map();

    [
      { email: managerUser.email, name: managerUser.name, role: 'Project Manager' },
      ...collaboratorUsers.map(u => ({ email: u.email, name: u.name, role: 'Collaborator' })),
      ...superAdmins.map(u => ({ email: u.email, name: u.name, role: 'Super Admin' }))
    ].forEach(r => {
      if (!recipientMap.has(r.email)) {
        recipientMap.set(r.email, r);
      }
    });

    // Send emails
    const templatePath = path.join(__dirname, '../templates/ProjectAssignment.html');
    if (fs.existsSync(templatePath)) {
      const templateHtml = fs.readFileSync(templatePath, 'utf8');

      for (const recipient of recipientMap.values()) {
        const html = templateHtml
          .replace(/{{PROJECT_NAME}}/g, name)
          .replace(/{{USER_NAME}}/g, recipient.name)
          .replace(/{{CLIENT_NAME}}/g, clientName)
          .replace(/{{START_DATE}}/g, new Date(startDate).toLocaleDateString())
          .replace(/{{ASSIGNED_ROLE}}/g, recipient.role)
          .replace(/{{LOGIN_URL}}/g, process.env.CLIENT_URL || 'http://localhost:5173');

        try {
          await sendEmail({
            email: recipient.email,
            subject: `Assigned to New Project: ${name}`,
            html: html
          });
        } catch (error) {
          console.error(`Email Error for ${recipient.email}:`, error);
        }
      }
    }

    // Log Activity
    await logActivity({
      user: currentUserId,
      project: createdProject._id,
      action: 'created',
      entityType: 'PROJECT',
      entityName: name,
      description: `Project "${name}" was created by ${req.user.name}`
    });

    res.status(201).json(projectTransformer(createdProject, [], currentUserRole));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin/Project Manager)
const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const { name, clientName, startDate, endDate, budget, manager, collaborators, description, status } = req.body;
    const oldCollaborators = project.collaborators.map(c => c.toString());
    const newCollaborators = collaborators || [];

    // Find newly added collaborators
    const addedCollaborators = newCollaborators.filter(c => !oldCollaborators.includes(c));

    // Track specific changes for activity log
    const changes = [];
    if (status && status !== project.status) {
      changes.push(`status changed to "${status}"`);
    }
    if (endDate && new Date(endDate).toLocaleDateString() !== new Date(project.endDate).toLocaleDateString()) {
      changes.push(`deadline updated to ${new Date(endDate).toLocaleDateString()}`);
    }
    if (name && name !== project.name) {
      changes.push(`name updated to "${name}"`);
    }
    if (description && description !== project.description) {
      changes.push(`description updated`);
    }

    project.name = name || project.name;
    project.clientName = clientName || project.clientName;
    project.startDate = startDate || project.startDate;
    project.endDate = endDate || project.endDate;
    project.budget = budget !== undefined ? budget : project.budget;
    project.manager = manager || project.manager;
    project.collaborators = newCollaborators;
    project.description = description || project.description;
    project.status = status || project.status;

    const updatedProject = await project.save();

    // Send emails and track added collaborators for log
    if (addedCollaborators.length > 0) {
      const collaboratorUsers = await User.find({ _id: { $in: addedCollaborators } });
      const teammateNames = collaboratorUsers.map(u => u.name).join(', ');
      changes.push(`added teammates: ${teammateNames}`);

      const templatePath = path.join(__dirname, '../templates/ProjectAssignment.html');
      if (fs.existsSync(templatePath)) {
        const templateHtml = fs.readFileSync(templatePath, 'utf8');
        for (const user of collaboratorUsers) {
          const html = templateHtml
            .replace(/{{PROJECT_NAME}}/g, project.name)
            .replace(/{{USER_NAME}}/g, user.name)
            .replace(/{{CLIENT_NAME}}/g, project.clientName)
            .replace(/{{START_DATE}}/g, new Date(project.startDate).toLocaleDateString())
            .replace(/{{ASSIGNED_ROLE}}/g, 'Collaborator')
            .replace(/{{LOGIN_URL}}/g, process.env.CLIENT_URL || 'http://localhost:5173');

          try {
            await sendEmail({
              email: user.email,
              subject: `You've been added to project: ${project.name}`,
              html: html
            });
          } catch (emailErr) {
            console.error(`Email failed for ${user.email}:`, emailErr.message);
          }
        }
      }
    }

    // Log Activity with detailed description focused only on changes
    const detailedDescription = changes.length > 0
      ? changes.join(', ')
      : `Project details were updated`;

    await logActivity({
      user: req.user.id,
      project: updatedProject._id,
      action: 'updated',
      entityType: 'PROJECT',
      entityName: updatedProject.name,
      description: detailedDescription
    });

    res.json(projectTransformer(updatedProject, [], req.user.role));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin/Project Manager)
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const projectName = project.name;
    const projectId = project._id;

    await project.deleteOne();
    // Also delete associated tasks
    await Task.deleteMany({ project: projectId });

    // Log Activity
    await logActivity({
      user: req.user.id,
      project: projectId,
      action: 'deleted',
      entityType: 'PROJECT',
      entityName: projectName,
      description: `Project "${projectName}" and its tasks were deleted by ${req.user.name}`
    });

    res.json({ message: 'Project removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
};
