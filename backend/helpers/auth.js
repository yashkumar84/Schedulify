const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/config');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, jwtSecret);
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

/**
 * authorize(...roles) — gates a route to specific roles (e.g. SUPER_ADMIN only)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }
    next();
  };
};

/**
 * checkPermission(feature, operation)
 * 
 * - SUPER_ADMIN  → always allowed
 * - TEAM_MEMBER  → checks req.user.permissions[feature][operation]
 * 
 * feature: 'projects' | 'tasks' | 'finance' | 'team'
 * operation: 'create' | 'read' | 'update' | 'delete'
 */
const checkPermission = (feature, operation) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Super admin bypasses all permission checks
    if (user.role === 'SUPER_ADMIN') {
      return next();
    }

    // Team member: check granular permission
    const featurePerms = user.permissions && user.permissions[feature];
    if (featurePerms && featurePerms[operation] === true) {
      return next();
    }

    return res.status(403).json({
      message: `You don't have permission to ${operation} ${feature}`
    });
  };
};

module.exports = { authenticate, authorize, checkPermission };
