const mongoose = require('mongoose');

const permissionFeatureSchema = {
  create: { type: Boolean, default: false },
  read: { type: Boolean, default: false },
  update: { type: Boolean, default: false },
  delete: { type: Boolean, default: false }
};

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'TEAM_MEMBER'],
    default: 'TEAM_MEMBER'
  },
  permissions: {
    projects: { ...permissionFeatureSchema },
    tasks: { ...permissionFeatureSchema },
    finance: { ...permissionFeatureSchema },
    team: {
      create: { type: Boolean, default: false },
      read: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  forgotPasswordToken: { type: String, default: '' },
  forgotPasswordCode: { type: String, default: '' },
  isLoggedIn: { type: Boolean, default: false },
  lastLogin: { type: Date }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);
module.exports = User;
