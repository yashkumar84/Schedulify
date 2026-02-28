const User = require('../models/User');
const { Roles } = require('../config/global');

// @desc    Get all team members
// @route   GET /api/team
// @access  Private (requires team.read permission)
const getTeamMembers = async (req, res) => {
  try {
    const members = await User.find({
      role: { $in: [Roles.TEAM_MEMBER, Roles.SUPER_ADMIN] }
    }).select('-password');

    res.json(members.map(m => ({
      id: m._id,
      name: m.name,
      email: m.email,
      role: m.role,
      permissions: m.permissions || {},
      isActive: m.isActive !== undefined ? m.isActive : true
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get members by role
// @route   GET /api/team/role/:role
// @access  Private
const getMembersByRole = async (req, res) => {
  try {
    const members = await User.find({ role: req.params.role }).select('-password');
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update member info (name/email)
// @route   PUT /api/team/:id
// @access  Private (Super Admin)
const updateMember = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === Roles.SUPER_ADMIN) {
      return res.status(403).json({ message: 'Cannot edit Super Admin via this endpoint' });
    }

    user.name = req.body.name || user.name;
    // Do NOT allow email updates (security)
    const updatedUser = await user.save();

    res.json({
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      permissions: updatedUser.permissions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update member permissions
// @route   PUT /api/team/:id/permissions
// @access  Private (Super Admin)
const updateMemberPermissions = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === Roles.SUPER_ADMIN) {
      return res.status(403).json({ message: 'Cannot modify Super Admin permissions' });
    }

    const { permissions } = req.body;
    if (!permissions) {
      return res.status(400).json({ message: 'Permissions object is required' });
    }

    // Merge permissions to prevent wiping unset fields
    user.permissions = {
      projects: {
        create: permissions.projects?.create ?? false,
        read: permissions.projects?.read ?? false,
        update: permissions.projects?.update ?? false,
        delete: permissions.projects?.delete ?? false
      },
      tasks: {
        create: permissions.tasks?.create ?? false,
        read: permissions.tasks?.read ?? false,
        update: permissions.tasks?.update ?? false,
        delete: permissions.tasks?.delete ?? false
      },
      finance: {
        create: permissions.finance?.create ?? false,
        read: permissions.finance?.read ?? false,
        update: permissions.finance?.update ?? false,
        delete: permissions.finance?.delete ?? false
      },
      team: {
        create: false, // team member creation is always super-admin only
        read: permissions.team?.read ?? false,
        update: false,
        delete: false
      }
    };

    const updatedUser = await user.save();

    res.json({
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      permissions: updatedUser.permissions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete member
// @route   DELETE /api/team/:id
// @access  Private (Super Admin)
const deleteMember = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === Roles.SUPER_ADMIN) {
      return res.status(403).json({ message: 'Cannot delete Super Admin' });
    }

    await user.deleteOne();
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTeamMembers,
  getMembersByRole,
  updateMember,
  updateMemberPermissions,
  deleteMember
};
