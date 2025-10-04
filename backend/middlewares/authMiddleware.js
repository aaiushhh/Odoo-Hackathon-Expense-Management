<<<<<<< HEAD
// This file will contain all access control logic

const { ObjectId } = require('mongoose').Types;
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret_for_hackathon';

/**
 * Middleware to check if the authenticated user has the 'Admin' role.
 */
const isAdmin = (req, res, next) => {
    // Assumes req.user is set by a prior JWT verification middleware
    if (!req.user || req.user.role !== 'Admin') {
        return res.status(403).json({ 
            success: false, 
            message: 'Access Denied. Admin privileges required.' 
        });
    }
    next();
};

/**
 * Middleware to check if the user is an Admin OR the Manager of the target user.
 * Useful for updating/viewing a specific user profile.
 */
const isAdminOrManager = (req, res, next) => {
    // Assumes req.user is set by JWT verification
    const { role } = req.user;
    const targetUserId = req.params.userId || req.body.managerId; // Or any target ID

    // 1. Check if Admin
    if (role === 'Admin') {
        return next();
    }
    
    // 2. Check if Manager (More complex logic needed here, e.g., fetching the target user)
    // For now, we'll keep it simple for user creation/fetch. The 'Manager' logic 
    // for approvals is handled elsewhere. For the admin routes, isAdmin is sufficient.
    
    // For now, let's just allow Admins for the core Admin tasks
    if (role === 'Manager') {
        // You would typically fetch the user being targeted and check their managerId
        // but since this is primarily Admin functionality, we'll stick to isAdmin for management routes.
        return res.status(403).json({ 
            success: false, 
            message: 'Access Denied. Admin or specific Manager privileges required.' 
        });
    }

    // Default catch-all
    return res.status(403).json({ 
        success: false, 
        message: 'Access Denied. Insufficient permissions.' 
    });
};

// Main JWT authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token. User not found.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
};


module.exports = { 
    isAdmin,
    isAdminOrManager,
    authenticate 
};
=======
// middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach user payload from token
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid token" });
  }
};
>>>>>>> 763fc7dbfb2a8fa88285739a062288fa22ad2b2e
