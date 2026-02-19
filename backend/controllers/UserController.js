const crypto = require('crypto');
const User = require('../models/User');
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

    const message = `
      <h1>Password Reset Request</h1>
      <p>Please use the following code to reset your password:</p>
      <h2>${resetCode}</h2>
      <p>This code is valid for 10 minutes.</p>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Code',
        html: message
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

module.exports = {
  loginUser,
  registerUser,
  updateUserRole,
  forgotPassword
};
