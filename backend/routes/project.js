const express = require('express');
const router = express.Router();
const { getAllProjects, getProjectById, createProject, updateProject, deleteProject } = require('../controllers/ProjectController');
const { authenticate, authorize } = require('../helpers/auth');
const { Roles } = require('../config/global');
const { validate, projectSchema } = require('../validations');

router.get('/', authenticate, getAllProjects);
router.get('/:id', authenticate, getProjectById);
router.post('/', authenticate, authorize(Roles.SUPER_ADMIN, Roles.PROJECT_MANAGER), validate(projectSchema), createProject);
router.put('/:id', authenticate, authorize(Roles.SUPER_ADMIN, Roles.PROJECT_MANAGER), validate(projectSchema), updateProject);
router.delete('/:id', authenticate, authorize(Roles.SUPER_ADMIN, Roles.PROJECT_MANAGER), deleteProject);

module.exports = router;
