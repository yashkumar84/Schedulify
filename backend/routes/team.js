const express = require('express');
const router = express.Router();
const { getTeamMembers, getMembersByRole } = require('../controllers/TeamController');
const { updateUserRole } = require('../controllers/UserController');
const { authenticate, authorize } = require('../helpers/auth');
const { Roles } = require('../config/global');

router.get('/', authenticate, getTeamMembers);
router.get('/role/:role', authenticate, getMembersByRole);
router.put('/:id/role', authenticate, authorize(Roles.SUPER_ADMIN), updateUserRole);

module.exports = router;
