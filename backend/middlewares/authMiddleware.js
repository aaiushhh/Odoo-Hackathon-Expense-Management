// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret_for_hackathon';

/**
 * Middleware to authenticate JWT and attach full user object to req.user
 */
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Decode token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch full user from DB (exclude password)
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    req.user = user; // attach user object to request
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: 'Invalid or expired token.'
    });
  }
};

/**
 * Middleware to restrict access based on allowed roles
 * @param {Array<String>} allowedRoles e.g. ['Admin', 'Manager']
 */
const authorizeRoles = (allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Forbidden. Role ${req.user ? req.user.role : 'None'} does not have permission.`
    });
  }
  next();
};

/**
 * Middleware to check if the user has the 'Admin' role
 */
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Access Denied. Admin privileges required.'
    });
  }
  next();
};

/**
 * Middleware to check if the user is an Admin OR Manager of a target user
 * Useful for updating/viewing specific user profile
 */
const isAdminOrManager = async (req, res, next) => {
  const { role, _id } = req.user;
  const targetUserId = req.params.userId || req.body.managerId;

  if (role === 'Admin') return next();

  if (role === 'Manager') {
    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Target user ID is required for Manager authorization.'
      });
    }

    const targetUser = await User.findById(targetUserId).select('managerId');
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Target user not found.' });
    }

    if (targetUser.managerId && targetUser.managerId.toString() === _id.toString()) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access Denied. You are not the manager of this user.'
    });
  }

  return res.status(403).json({
    success: false,
    message: 'Access Denied. Insufficient permissions.'
  });
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  isAdmin,
  isAdminOrManager
};
