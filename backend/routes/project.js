const express = require('express');
const router = express.Router();
const { getAllProjects, getProjectById, createProject, updateProject, deleteProject } = require('../controllers/ProjectController');
const { authenticate, checkPermission } = require('../helpers/auth');
const { validate, projectSchema } = require('../validations');

router.get('/', authenticate, checkPermission('projects', 'read'), getAllProjects);
router.get('/:id', authenticate, checkPermission('projects', 'read'), getProjectById);
router.post('/', authenticate, checkPermission('projects', 'create'), validate(projectSchema), createProject);
router.put('/:id', authenticate, checkPermission('projects', 'update'), validate(projectSchema), updateProject);
router.delete('/:id', authenticate, checkPermission('projects', 'delete'), deleteProject);

module.exports = router;
