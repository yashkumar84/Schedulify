const express = require('express');
const router = express.Router();
const {
    getTeamMembers,
    getMembersByRole,
    updateMember,
    deleteMember,
    updateMemberPermissions
} = require('../controllers/TeamController');
const { updateUserRole } = require('../controllers/UserController');
const { authenticate, authorize, checkPermission } = require('../helpers/auth');
const { Roles } = require('../config/global');

// Get all team members — any authenticated user (needed for task assignment)
router.get('/', authenticate, getTeamMembers);

// Kept for backward compat
router.get('/role/:role', authenticate, getMembersByRole);

// Admin-only mutations
router.put('/:id/role', authenticate, authorize(Roles.SUPER_ADMIN), updateUserRole);
router.put('/:id/permissions', authenticate, authorize(Roles.SUPER_ADMIN), updateMemberPermissions);
router.put('/:id', authenticate, authorize(Roles.SUPER_ADMIN), updateMember);
router.delete('/:id', authenticate, authorize(Roles.SUPER_ADMIN), deleteMember);

module.exports = router;
