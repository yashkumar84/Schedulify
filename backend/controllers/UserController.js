const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { hashPassword, comparePassword, generateToken } = require('../helpers/common');
const sendEmail = require('../helpers/mail');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async(req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && comparePassword(password, user.password)) {
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token: generateToken(user)
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

// @desc    Register a new user (Admin only)
// @route   POST /api/auth/register
// @access  Private (SUPER_ADMIN only)
const registerUser = async(req, res) => {
  const { name, email, password, role } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400).json({ message: 'User already exists' });
    return;
  }

  const hashedPassword = await hashPassword(password);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: role || 'INHOUSE_TEAM' // Default role
  });

  if (user) {
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

// @desc    Update user role
// @route   PUT /api/team/:id/role
// @access  Private (Super Admin)
const updateUserRole = async(req, res) => {
  const { role } = req.body;
  const user = await User.findById(req.params.id);

  if (user) {
    user.role = role || user.role;
    const updatedUser = await user.save();
    res.json({
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async(req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'There is no user with that email' });
    }

    // Generate reset token (6 digit code for simplicity)
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetToken = crypto.randomBytes(20).toString('hex');

    user.forgotPasswordCode = resetCode;
    user.forgotPasswordToken = resetToken;
    await user.save();

    const templatePath = path.join(__dirname, '../templates/ForgotPassword.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf8');
    htmlContent = htmlContent.replace('{{RESETPASSWORDCODE}}', resetCode);

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Code',
        html: htmlContent
      });

      res.status(200).json({ message: 'Email sent' });
    } catch (err) {
      console.log(err);
      user.forgotPasswordCode = '';
      user.forgotPasswordToken = '';
      await user.save();

      return res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async(req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || user.forgotPasswordCode !== otp) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    res.status(200).json({
      message: 'OTP verified',
      token: user.forgotPasswordToken
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async(req, res) => {
  const { email, token, password } = req.body;

  try {
    const user = await User.findOne({ email, forgotPasswordToken: token });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    user.password = hashedPassword;
    user.forgotPasswordCode = '';
    user.forgotPasswordToken = '';
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async(req, res) => {
  const user = await User.findById(req.user.id).select('-password');

  if (user) {
    const projectCount = await Project.countDocuments({ manager: user._id });
    const taskCount = await Task.countDocuments({ assignedTo: user._id });

    res.json({
      ...user._doc,
      projectCount,
      taskCount
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async(req, res) => {
  const user = await User.findById(req.user.id);

  if (user) {
    user.name = req.body.name || user.name;
    // Email is not allowed to be updated per user request
    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = async(req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id);

  if (user) {
    if (comparePassword(currentPassword, user.password)) {
      user.password = await hashPassword(newPassword);
      await user.save();
      res.json({ message: 'Password changed successfully' });
    } else {
      res.status(400).json({ message: 'Invalid current password' });
    }
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

module.exports = {
  loginUser,
  registerUser,
  updateUserRole,
  forgotPassword,
  verifyOtp,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  changePassword
};
