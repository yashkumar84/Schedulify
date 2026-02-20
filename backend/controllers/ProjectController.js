const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const sendEmail = require('../helpers/mail');
const { Roles } = require('../config/global');
const { projectTransformer, projectListTransformer } = require('../transformers/projectTransformer');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
const getAllProjects = async(req, res) => {
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

    res.json(projectListTransformer(projects));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get project by ID with tasks and metrics
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async(req, res) => {
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
    res.json(projectTransformer(project, tasks));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a project
// @route   POST /api/projects
// @access  Private (Admin/Project Manager)
const createProject = async(req, res) => {
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
    const collaboratorUsers = await User.find({ _id: { $in: collaborators || [] }});
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
        } catch (emailErr) {
          console.error(`Email failed for ${recipient.email}:`, emailErr.message);
        }
      }
    }

    res.status(201).json(createdProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject
};
