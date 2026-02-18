const express = require('express');
const router = express.Router();
const { loginUser, registerUser } = require('../controllers/UserController');
const { authenticate, authorize } = require('../helpers/auth');
const { Roles } = require('../config/global');

router.post('/login', loginUser);
// Only SUPER_ADMIN can register new users
router.post('/register', authenticate, authorize(Roles.SUPER_ADMIN), registerUser);

module.exports = router;
