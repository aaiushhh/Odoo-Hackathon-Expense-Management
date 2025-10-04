// routes/companyAndUserRoutes.js
const express = require('express');
const router = express.Router();

// Controllers
const {
  getUsers,
  createUser,
  updateUser,
  sendPassword
} = require('../controllers/userController');

const {
  getCompany,
  updateCompany
} = require('../controllers/companyController');

// Middlewares
const {
  authenticateToken,
  authorizeRoles,
  isAdmin
} = require('../middlewares/authMiddleware');

/**
 * -------------------------
 * Company Routes
 * -------------------------
 */

// GET company info (any authenticated user)
router.get('/company', authenticateToken, getCompany);

// PUT update company info (Admin only)
router.put('/company', authenticateToken, isAdmin, updateCompany);

/**
 * -------------------------
 * User Routes (Admin only)
 * -------------------------
 */

// Apply authentication + Admin role for all user routes
router.use('/users', authenticateToken, authorizeRoles(['Admin']));

// GET all users in company
router.get('/users', getUsers);

// POST create new user
router.post('/users', createUser);

// PUT update user role/manager
router.put('/users/:id', updateUser);

// POST reset/send password
router.post('/users/:id/reset-password', sendPassword);

module.exports = router;
