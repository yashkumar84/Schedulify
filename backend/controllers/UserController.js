const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret } = require('../config/config');

const generateToken = (id) => {
    return jwt.sign({ id }, jwtSecret, {
        expiresIn: '30d',
    });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            token: generateToken(user._id),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

// @desc    Register a new user (Admin only)
// @route   POST /api/auth/register
// @access  Private (SUPER_ADMIN only)
const registerUser = async (req, res) => {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400).json({ message: 'User already exists' });
        return;
    }

    const user = await User.create({
        name,
        email,
        password,
        role: role || 'INHOUSE_TEAM', // Default role
    });

    if (user) {
        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Update user role
// @route   PUT /api/team/:id/role
// @access  Private (Super Admin)
const updateUserRole = async (req, res) => {
    const { role } = req.body;
    const user = await User.findById(req.params.id);

    if (user) {
        user.role = role || user.role;
        const updatedUser = await user.save();
        res.json({
            id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

module.exports = {
    loginUser,
    registerUser,
    updateUserRole,
};
