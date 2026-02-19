const express = require('express');
const router = express.Router();
const { loginUser, registerUser, forgotPassword, verifyOtp, resetPassword } = require('../controllers/UserController');
const { authenticate, authorize } = require('../helpers/auth');
const { Roles } = require('../config/global');

router.post('/login', loginUser);
// Only SUPER_ADMIN can register new users
router.post('/register', authenticate, authorize(Roles.SUPER_ADMIN), registerUser);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

module.exports = router;
