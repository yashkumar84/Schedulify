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

// Get all team members — requires team.read permission (or SUPER_ADMIN)
router.get('/', authenticate, checkPermission('team', 'read'), getTeamMembers);

// Kept for backward compat — same permission gating
router.get('/role/:role', authenticate, checkPermission('team', 'read'), getMembersByRole);

// Admin-only mutations
router.put('/:id/role', authenticate, authorize(Roles.SUPER_ADMIN), updateUserRole);
router.put('/:id/permissions', authenticate, authorize(Roles.SUPER_ADMIN), updateMemberPermissions);
router.put('/:id', authenticate, authorize(Roles.SUPER_ADMIN), updateMember);
router.delete('/:id', authenticate, authorize(Roles.SUPER_ADMIN), deleteMember);

module.exports = router;
