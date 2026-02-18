const Project = require('../models/Project');
const Task = require('../models/Task');
const { projectTransformer, projectListTransformer } = require('../transformers/projectTransformer');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
const getAllProjects = async(req, res) => {
  try {
    const projects = await Project.find().populate('manager', 'name email').sort({ createdAt: -1 });
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
    const project = await Project.findById(req.params.id).populate('manager', 'name email');
    if (project) {
      const tasks = await Task.find({ project: project._id });
      res.json(projectTransformer(project, tasks));
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a project
// @route   POST /api/projects
// @access  Private (Admin)
const createProject = async(req, res) => {
  try {
    const projectData = req.body;
    const currentUser = req.user;

    // Auto-assign SUPER_ADMIN as manager if no manager provided
    if (!projectData.manager && currentUser?.role === 'SUPER_ADMIN') {
      projectData.manager = currentUser._id;
      console.log('Auto-assigning SUPER_ADMIN as project manager:', projectData.manager);
    }

    // Validate manager is provided
    if (!projectData.manager) {
      return res.status(400).json({
        message: 'Project manager is required. Please select a manager or contact an administrator.'
      });
    }

    const project = new Project({
      ...projectData,
      manager: projectData.manager
    });
    const createdProject = await project.save();
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
