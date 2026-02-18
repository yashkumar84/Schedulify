const User = require('../models/User');
const { Roles } = require('../config/global');

// @desc    Get all team members
// @route   GET /api/team
// @access  Private (Admin, PM)
const getTeamMembers = async(req, res) => {
  try {
    const members = await User.find({
      role: { $in: [Roles.INHOUSE_TEAM, Roles.OUTSOURCED_TEAM, Roles.PROJECT_MANAGER, Roles.FINANCE_TEAM, Roles.SUPER_ADMIN] }
    }).select('-password');
    res.json(members.map(m => ({
      id: m._id,
      name: m.name,
      email: m.email,
      role: m.role,
      isActive: m.isActive || true
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get members by role
// @route   GET /api/team/role/:role
// @access  Private
const getMembersByRole = async(req, res) => {
  try {
    const members = await User.find({ role: req.params.role }).select('-password');
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTeamMembers,
  getMembersByRole
};
