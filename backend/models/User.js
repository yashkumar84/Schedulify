const mongoose = require('mongoose');
const { Roles } = require('../config/global');

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
    enum: Object.values(Roles),
    default: Roles.INHOUSE_TEAM
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
